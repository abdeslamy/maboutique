"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Connexion MARCHAND — celui qui vient gérer sa boutique.
 *
 * Distinct de <FormulaireConnexion />, qui sert les acheteurs. Trois
 * différences, et c'est tout ce qui justifie un second composant :
 *
 *  1. La destination. Ici /admin, pas /compte.
 *  2. Pas de lien « créer un compte » : un marchand ne s'inscrit pas seul,
 *     son accès lui est ouvert.
 *  3. Le cas du client égaré. Ses identifiants sont valides, mais il n'a rien
 *     à faire ici. L'envoyer sur /admin lui donnerait un 404 sec ; on lui dit
 *     ce qui se passe et on lui rouvre la boutique.
 */
export default function FormulaireConnexionMarchand() {
  const t = useTranslations("connexionMarchand");
  const { seConnecter } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setCleErreur(null);
    setChargement(true);

    const resultat = await seConnecter(email, motDePasse);

    if (!resultat.ok) {
      setCleErreur(resultat.cleErreur);
      setChargement(false);
      return;
    }

    if (resultat.role !== "admin") {
      // Compte valide, mais côté acheteur. La session est bel et bien ouverte
      // — on ne la referme pas, elle est légitime : on l'oriente.
      setCleErreur("pas_marchand");
      setChargement(false);
      return;
    }

    // router.refresh() force le re-rendu des composants serveur pour qu'ils
    // voient le nouveau cookie de session — sans quoi le layout /admin
    // relirait l'ancienne session et redirigerait ici même.
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        {t("titre")}
      </h1>
      <p className="mb-8 text-gray-600">{t("sousTitre")}</p>

      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("email")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("motDePasse")}</span>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        {cleErreur && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p>{t(`erreurs.${cleErreur}`)}</p>

            {/* Le client égaré repart vers la boutique plutôt que de buter
                sur un formulaire qui ne le concerne pas. */}
            {cleErreur === "pas_marchand" && (
              <Link href="/" className="mt-1 inline-block font-medium underline">
                {t("retourBoutique")}
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </button>
      </form>
    </section>
  );
}
