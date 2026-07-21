"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Formulaire de connexion.
 * Appelle seConnecter() de AuthContext, qui :
 *  1. POSTe vers /api/auth/connexion,
 *  2. Si succès, met à jour l'état client (utilisateur connecté).
 * On redirige ensuite vers /compte.
 */
export default function FormulaireConnexion() {
  const t = useTranslations("connexion");
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

    // Connexion réussie → redirection vers /compte.
    // router.refresh() force aussi le re-rendu des composants serveur
    // pour qu'ils prennent en compte le nouveau cookie de session.
    router.push("/compte");
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
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {t(`erreurs.${cleErreur}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t("pasDeCompte")}{" "}
        <Link
          href="/inscription"
          className="font-medium text-black underline"
        >
          {t("creerCompte")}
        </Link>
      </p>
    </section>
  );
}
