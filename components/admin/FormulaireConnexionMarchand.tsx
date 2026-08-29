"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";

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

/**
 * Cadre commun aux deux logos.
 *
 * Sans lui, les deux boutons n'auraient pas le même retrait : le cadre SVG de
 * Google fait 18 px, celui d'Apple 22, et comme le contenu du bouton est
 * centré, l'écart se répercuterait sur le libellé — 2 px de décalage entre les
 * deux lignes. Un cadre fixe de 22 px les aligne exactement.
 */
function CadreLogo({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

/** Logo Google, quatre couleurs, 18 px. */
function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.83Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

/**
 * Logo Apple, monochrome.
 *
 * Rendu à 22 px et non 18 comme Google, et ce n'est pas une erreur : les deux
 * dessins ne remplissent pas leur cadre de la même façon. Mesuré — Google
 * occupe 91,7 % de son viewBox, Apple seulement 75 %. À cadre égal, la pomme
 * paraissait un cinquième plus petite.
 *
 * 16,5 / 0,75 = 22 : les deux glyphes font désormais 16,5 px optiques. Leurs
 * centres coïncidaient déjà avec celui du viewBox, l'alignement vertical
 * n'avait rien à corriger.
 */
function LogoApple() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a0a0a" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

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
      className="w-full max-w-[452px] rounded-[28px] border border-[#f4f1ec] bg-white px-[34px] pb-7 pt-[34px] [@media(max-height:900px)]:pb-5 [@media(max-height:900px)]:pt-6"
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
          {t("continuerGoogle")}
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
          {t("continuerApple")}
        </button>
      </div>

      {/* ── Séparateur ─────────────────────────────────────────────────── */}
      <div className="my-[22px] [@media(max-height:900px)]:my-3.5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-[#e9e4db]" />
        <span className="text-[11.5px] font-medium tracking-[.09em] text-[#9a9288]">
          {t("ou")}
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
      <p className="mt-5 [@media(max-height:900px)]:mt-3.5 text-center text-[12.5px] leading-[1.55] text-[#8b8377]">
        {t.rich("mentions", { cgu: mentionSoulignee, confid: mentionSoulignee })}
      </p>
    </div>
  );
}
