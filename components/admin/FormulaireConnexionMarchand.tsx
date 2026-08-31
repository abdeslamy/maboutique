"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { CadreLogo, LogoApple, LogoGoogle } from "@/components/admin/LogosOAuth";

/**
 * Connexion MARCHAND — celui qui vient gérer sa boutique.
 *
 * Distinct de <FormulaireConnexion />, qui sert les acheteurs : la destination
 * est /admin et non /compte, et le client qui atterrit ici par erreur est
 * orienté plutôt que jeté sur un 404.
 *
 * ── Ce qui est DÉCORATIF et ne fait rien ───────────────────────────────────
 *
 * La maquette est reproduite à l'identique, y compris les éléments dont la
 * mécanique n'existe pas encore :
 *
 *  - Google et Apple : aucune connexion OAuth n'est branchée. Les boutons sont
 *    présents, leur clic ne déclenche rien.
 *  - CGU et politique de confidentialité : les pages n'existent pas. Le texte
 *    est là, souligné comme dans la maquette, sans destination.
 *  - « Créer un compte marchand » : l'inscription libre n'existe pas non plus.
 *
 * ⚠️ Choix assumé et demandé explicitement. Deux précautions le rendent
 * tenable : ces éléments portent `aria-disabled` et sortent du parcours au
 * clavier (`tabIndex={-1}`), pour qu'un marchand au clavier ou au lecteur
 * d'écran ne bute pas sur des commandes sans effet. Le jour où la mécanique
 * arrive, il suffit de brancher un `onClick` et de retirer ces attributs — la
 * mise en page ne bouge pas d'un pixel.
 *
 * Le seul écart avec la maquette est le champ MOT DE PASSE. Elle montre un
 * champ e-mail seul, ce qui suppose un lien magique ; l'authentification est
 * ici e-mail + mot de passe. Le champ reprend exactement la géométrie de celui
 * du dessus.
 */

export default function FormulaireConnexionMarchand() {
  const t = useTranslations("connexionMarchand");
  // Libellés communs à TOUS les écrans d'accès, client comme vendeur.
  const ta = useTranslations("authPartage");
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

  // Les deux boutons OAuth partagent tout sauf leur logo et leur libellé.
  const boutonOAuth =
    "flex h-[52px] w-full items-center justify-center gap-[11px] rounded-[11px] " +
    "border border-[#e2ddd4] bg-white text-[15.5px] font-medium text-[#0a0a0a] " +
    "transition-[border-color,box-shadow] hover:border-[#cdc6ba]";

  // Champ et bouton principal partagent la même géométrie : c'est ce qui donne
  // à la carte son alignement vertical régulier.
  const champ =
    "h-[52px] w-full rounded-[11px] border border-[#ded8ce] bg-white px-[18px] " +
    "text-[15.5px] text-[#0a0a0a] placeholder:text-[#a49c91] " +
    "focus:border-[#0a0a0a] focus:outline-none";

  /** Souligné des mentions légales. DÉCORATIF — sans destination. */
  const mentionSoulignee = (chunks: React.ReactNode) => (
    <span
      role="link"
      aria-disabled="true"
      className="cursor-default underline underline-offset-2"
    >
      {chunks}
    </span>
  );

  return (
    <div
      className="w-full max-w-[452px] rounded-[28px] border border-[#f4f1ec] bg-white px-[34px] pb-7 pt-[34px] [@media(max-height:899px)]:pb-5 [@media(max-height:899px)]:pt-6"
      style={{
        boxShadow: "0 20px 48px rgba(52,42,28,.09), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      {/* ── DÉCORATIF : aucune connexion OAuth n'est branchée ──────────── */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={boutonOAuth}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoGoogle />
          </CadreLogo>
          {ta("continuerGoogle")}
        </button>

        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={boutonOAuth}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoApple />
          </CadreLogo>
          {ta("continuerApple")}
        </button>
      </div>

      {/* ── Séparateur ─────────────────────────────────────────────────── */}
      <div className="my-[22px] [@media(max-height:899px)]:my-3.5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-[#e9e4db]" />
        <span className="text-[11.5px] font-medium tracking-[.09em] text-[#9a9288]">
          {ta("ou")}
        </span>
        <span className="h-px flex-1 bg-[#e9e4db]" />
      </div>

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

            {/* Le client égaré repart vers la boutique plutôt que de buter sur
                un formulaire qui ne le concerne pas. Celui-ci est un VRAI
                lien : c'est la seule sortie utile de l'écran. */}
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
          className="h-[52px] w-full rounded-[11px] bg-[#0a0a0a] text-[15.5px] font-semibold text-white transition-[background-color,box-shadow] hover:bg-[#1c1c1c] disabled:opacity-60"
          style={{ boxShadow: "0 4px 14px rgba(10,10,10,.18)" }}
        >
          {chargement ? t("connexionEnCours") : t("continuerEmail")}
        </button>
      </form>

      {/* ── DÉCORATIF : les pages CGU et confidentialité n'existent pas ── */}
      <p className="mt-5 [@media(max-height:899px)]:mt-3.5 text-center text-[12.5px] leading-[1.55] text-[#8b8377]">
        {ta.rich("mentions", { cgu: mentionSoulignee, confid: mentionSoulignee })}
      </p>
    </div>
  );
}
