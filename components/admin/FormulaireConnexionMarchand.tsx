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
 *
 * ── Écarts assumés avec la maquette 4a ─────────────────────────────────────
 *
 * La carte de la maquette contient deux boutons OAuth (Google, Apple), un
 * séparateur « OU », puis un champ e-mail seul suivi de « Continuer avec
 * l'e-mail ». Trois choses manquent pour la reproduire :
 *
 *  - la plateforme n'a AUCUNE connexion OAuth. Deux boutons morts en tête de
 *    carte, à la place la plus visible, valent moins que pas de boutons ;
 *  - un champ e-mail sans mot de passe suppose un lien magique par e-mail.
 *    L'authentification est ici e-mail + mot de passe ;
 *  - la mention « En continuant, vous acceptez les CGU… » et le lien « Créer
 *    un compte marchand » renvoient à des pages qui n'existent pas, et à une
 *    inscription libre qu'on ne veut pas.
 *
 * Les DIMENSIONS de la maquette sont en revanche respectées à l'identique :
 * hauteurs de 52 px, radius 11, bordures, focus noir sans anneau coloré,
 * ombres du bouton principal. Le jour où OAuth existe, les deux boutons se
 * glissent au-dessus du champ e-mail sans rien changer d'autre.
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

  // Champ et bouton partagent la même géométrie : c'est ce qui donne à la
  // carte son alignement vertical régulier.
  const champ =
    "h-[52px] w-full rounded-[11px] border border-[#ded8ce] bg-white px-[18px] " +
    "text-[15.5px] text-[#0a0a0a] placeholder:text-[#a49c91] " +
    "focus:border-[#0a0a0a] focus:outline-none";

  return (
    <div
      className="w-full max-w-[452px] rounded-[28px] border border-[#f4f1ec] bg-white px-[34px] pb-7 pt-[34px]"
      style={{
        boxShadow: "0 20px 48px rgba(52,42,28,.09), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        {/* La maquette n'affiche pas de libellés, seulement des indications
            dans les champs. Les libellés existent quand même, masqués : un
            placeholder n'est pas un nom accessible, il disparaît à la saisie
            et beaucoup de lecteurs d'écran ne l'annoncent pas. */}
        <label htmlFor="marchand-email" className="sr-only">
          {t("email")}
        </label>
        <input
          id="marchand-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          className={champ}
        />

        <label htmlFor="marchand-mot-de-passe" className="sr-only">
          {t("motDePasse")}
        </label>
        <input
          id="marchand-mot-de-passe"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder={t("motDePassePlaceholder")}
          autoComplete="current-password"
          required
          className={champ}
        />

        {cleErreur && (
          <div
            role="alert"
            className="rounded-[11px] bg-[#fbf1ee] px-[18px] py-3.5 text-[13.5px] leading-[1.45] text-[#9c3a29]"
          >
            <p>{t(`erreurs.${cleErreur}`)}</p>

            {/* Le client égaré repart vers la boutique plutôt que de buter
                sur un formulaire qui ne le concerne pas. */}
            {cleErreur === "pas_marchand" && (
              <Link
                href="/"
                className="mt-1 inline-block font-medium underline underline-offset-2"
              >
                {t("retourBoutique")}
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="mt-0 h-[52px] w-full rounded-[11px] bg-[#0a0a0a] text-[15.5px] font-semibold text-white transition-[background-color,box-shadow] hover:bg-[#1c1c1c] disabled:opacity-60"
          style={{ boxShadow: "0 4px 14px rgba(10,10,10,.18)" }}
        >
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </button>
      </form>
    </div>
  );
}
