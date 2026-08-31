"use client";

import { useTranslations } from "next-intl";
import { CadreLogo, LogoApple, LogoGoogle } from "@/components/admin/LogosOAuth";
import VisuelCompteClient from "@/components/auth/VisuelCompteClient";

/**
 * Le cadre des écrans de compte CLIENT — connexion et création de compte.
 *
 * Il reprend la STRUCTURE de l'espace vendeur : deux colonnes, carte flottante
 * à gauche, panneau décoratif à droite, connexions Google et Apple en tête de
 * carte.
 *
 * ── Ce qui les sépare quand même ──────────────────────────────────────────
 *
 * La structure se rapproche, donc la distinction repose entièrement sur le
 * reste — et il y en a assez pour qu'on ne s'y trompe pas :
 *
 *   |            | Vendeur (/admin)          | Client (la vitrine)        |
 *   |------------|---------------------------|----------------------------|
 *   | habillage  | plein écran nu            | DANS la boutique — barre,  |
 *   |            |                           | pied de page, tab bar      |
 *   | fond       | crème #fefdfc             | bande grise, carte blanche |
 *   | titres     | Newsreader serif, léger   | police boutique, semi-gras |
 *   | boutons    | rectangle, radius 11      | PILULE, champs à radius 16 |
 *   | accent     | aucun sur les champs      | VERT au focus              |
 *   | panneau    | ventes, KPIs, conversion  | SA commande, SES colis     |
 *
 * Le dernier point est le plus parlant : le vendeur voit ce qu'il encaisse, le
 * client voit ce qu'il reçoit. Deux mondes, jamais les mêmes cartes.
 *
 * Le plus fort reste le premier, et il est gratuit : le client garde la
 * navigation de la boutique autour de l'écran.
 */

/** Hauteur commune aux champs et aux boutons — la même que côté vendeur. */
const HAUTEUR_CONTROLE = "h-[52px]";

/** Suivi de commande. */
function IconeSuivi() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.6 12 3.4l8.5 4.2v8.8L12 20.6 3.5 16.4Z"
        stroke="#16803c"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.5 7.6 12 11.9l8.5-4.3M12 11.9v8.7" stroke="#16803c" strokeWidth="1.6" />
    </svg>
  );
}

/** Livraison. */
function IconeLivraison() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M2.8 7.4h9.4v8.9H2.8Zm9.4 2.7h3.9l2.9 2.9v3.3h-6.8Z"
        stroke="#16803c"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.7" stroke="#16803c" strokeWidth="1.6" />
      <circle cx="16.6" cy="18" r="1.7" stroke="#16803c" strokeWidth="1.6" />
    </svg>
  );
}

/** Paiement à la livraison. */
function IconePaiement() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="2.8" y="5.8" width="18.4" height="12.4" rx="2.4" stroke="#16803c" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.6" stroke="#16803c" strokeWidth="1.6" />
    </svg>
  );
}

export function CadreAuthClient({
  titre,
  sousTitre,
  children,
  bas,
}: {
  titre: string;
  sousTitre: string;
  /** Le contenu de la carte. */
  children: React.ReactNode;
  /**
   * Le lien sous la carte, vers l'autre écran. Fourni par le formulaire, qui
   * utilise le <Link> localisé de @/i18n/navigation — un <a> brut perdrait le
   * préfixe de langue.
   */
  bas?: React.ReactNode;
}) {
  const t = useTranslations("authClient");

  const repères = [
    { Icone: IconeSuivi, texte: t("avantageSuivi") },
    { Icone: IconeLivraison, texte: t("avantageLivraison") },
    { Icone: IconePaiement, texte: t("avantagePaiement") },
  ];

  return (
    // Bande pleine largeur, très légèrement teintée : elle détache aussi bien
    // la carte blanche que le panneau crème, et fait lire tout le bloc comme
    // une zone à part dans la boutique.
    <div className="w-full bg-[#f7f7f6]">
      <div className="mx-auto flex max-w-6xl items-center gap-14 px-4 py-14 sm:px-6 lg:py-16">
        {/* ── Colonne du formulaire ─────────────────────────────────── */}
        <div className="mx-auto w-full max-w-[452px] lg:mx-0 lg:shrink-0">
          <h1 className="text-center text-[30px] font-semibold leading-[1.15] tracking-tight text-gray-900 sm:text-[34px]">
            {titre}
          </h1>
          <p className="mx-auto mt-3 max-w-[380px] text-pretty text-center text-[15.5px] leading-[1.5] text-gray-500">
            {sousTitre}
          </p>

          <div className="mt-8 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(17,17,17,.07),0_2px_6px_rgba(17,17,17,.04)] sm:p-7">
            {children}
          </div>

          {bas && <p className="mt-6 text-center text-sm text-gray-600">{bas}</p>}

          {/* Trois repères — et ce ne sont pas des promesses en l'air : le
              suivi existe (la Timeline des commandes), les 58 wilayas sont
              dans lib/wilayas.ts, et le paiement à la livraison est le seul
              mode de la plateforme.

              Masqués dès que le panneau apparaît : il dit la même chose, en
              mieux. Les répéter alourdirait la colonne pour rien. */}
          <ul className="mt-10 flex flex-col gap-3 border-t border-gray-200/70 pt-8 sm:flex-row sm:justify-center sm:gap-6 sm:border-0 sm:pt-9 lg:hidden">
            {repères.map(({ Icone, texte }) => (
              <li
                key={texte}
                className="flex items-center gap-2.5 text-[13.5px] font-medium text-gray-600 sm:flex-col sm:gap-2 sm:text-center"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-50">
                  <Icone />
                </span>
                {texte}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Colonne du panneau ────────────────────────────────────────
            Purement décorative, donc la première à partir quand la place
            manque. Hauteur fixe plutôt que liée au viewport : cette page vit
            DANS la boutique, entre une barre et un pied de page — la caler sur
            la hauteur de l'écran la ferait déborder. */}
        <div className="hidden h-[660px] flex-1 lg:flex">
          <VisuelCompteClient />
        </div>
      </div>
    </div>
  );
}

/**
 * Les connexions Google et Apple, puis le séparateur.
 *
 * ⚠️ DÉCORATIF, comme côté vendeur : aucune connexion OAuth n'est branchée.
 * Les boutons portent `aria-disabled` et sortent du parcours au clavier, pour
 * qu'on ne bute pas dessus en tabulant.
 *
 * Le rayon est de 16 px, celui des champs du client — et non les 11 px du
 * vendeur. C'est l'un des écarts qui séparent les deux familles d'écrans.
 */
export function BoutonsOAuthClient() {
  const ta = useTranslations("authPartage");

  const bouton = `${HAUTEUR_CONTROLE} flex w-full items-center justify-center gap-[11px] rounded-2xl border border-gray-200 bg-white text-[15px] font-medium text-gray-900 transition-colors hover:bg-gray-50`;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <button type="button" aria-disabled="true" tabIndex={-1} className={bouton}>
          <CadreLogo>
            <LogoGoogle />
          </CadreLogo>
          {ta("continuerGoogle")}
        </button>
        <button type="button" aria-disabled="true" tabIndex={-1} className={bouton}>
          <CadreLogo>
            <LogoApple />
          </CadreLogo>
          {ta("continuerApple")}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[11.5px] font-medium tracking-[.09em] text-gray-400">
          {ta("ou")}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </>
  );
}

/**
 * Un champ, libellé visible au-dessus.
 *
 * Deux marques d'appartenance à la vitrine : `rounded-2xl` (16 px) là où
 * l'espace vendeur est à 11, et un focus VERT au lieu du noir sec — c'est la
 * couleur de la boutique, et elle n'apparaît nulle part côté gestion.
 */
export function ChampClient({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  aide,
  minLength,
}: {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  aide?: string;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13.5px] font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={`${HAUTEUR_CONTROLE} w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 text-[15.5px] text-gray-900 transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-600/10`}
      />
      {aide && <span className="text-xs text-gray-500">{aide}</span>}
    </div>
  );
}

/** Le bouton principal — une PILULE, la forme de toute la vitrine. */
export function BoutonPrincipalClient({
  chargement,
  children,
}: {
  chargement?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={chargement}
      className={`${HAUTEUR_CONTROLE} mt-2 w-full rounded-full bg-black text-[15px] font-semibold text-white shadow-[0_6px_18px_rgba(10,10,10,.16)] transition hover:bg-gray-800 disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

/** Le bloc d'erreur, au même rayon que les champs. */
export function AlerteClient({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] leading-[1.45] text-red-700"
    >
      {children}
    </p>
  );
}
