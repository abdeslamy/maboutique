"use client";

import { useTranslations } from "next-intl";

/**
 * Le cadre des écrans de compte CLIENT — connexion et création de compte.
 *
 * ── Deux exigences, et la première avait été négligée ─────────────────────
 *
 * 1. QUE LA PAGE SOIT BELLE. Première tentative : une carte blanche sur fond
 *    blanc. Le changement était réel mais invisible — la carte ne se détachait
 *    de rien. D'où, ici : une bande teintée derrière le formulaire, un accent
 *    vert, et surtout trois repères sous la carte. Une page de connexion vide
 *    n'a aucune raison d'exister visuellement ; celle-ci dit maintenant à quoi
 *    sert un compte.
 *
 * 2. QU'ON NE LA CONFONDE PAS avec l'espace vendeur. La distinction porte sur
 *    six axes, tous dans le même sens :
 *
 *      |            | Vendeur (/admin)         | Client (la vitrine)       |
 *      |------------|--------------------------|---------------------------|
 *      | habillage  | plein écran nu           | DANS la boutique — barre, |
 *      |            |                          | pied de page, tab bar     |
 *      | colonnes   | deux, panneau décoratif  | une seule, centrée        |
 *      | fond       | crème #fefdfc            | bande grise, carte claire |
 *      | titres     | Newsreader serif, léger  | police boutique, semi-gras|
 *      | boutons    | rectangle, radius 11     | PILULE                    |
 *      | accent     | aucun sur les champs     | VERT au focus             |
 *
 * Ce qui est repris du vendeur, c'est le NIVEAU d'exécution — champs de 52 px,
 * espacements réguliers — jamais l'apparence. Un client ne mérite pas un
 * formulaire moins soigné parce qu'il achète au lieu de vendre.
 */

/** Hauteur commune aux champs et au bouton — la même que côté vendeur. */
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
      <rect
        x="2.8"
        y="5.8"
        width="18.4"
        height="12.4"
        rx="2.4"
        stroke="#16803c"
        strokeWidth="1.6"
      />
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
    // Bande pleine largeur, très légèrement teintée. C'est elle qui manquait :
    // sans elle, une carte blanche posée sur du blanc ne se détache de rien, et
    // le travail sur la carte ne se voyait pas.
    <div className="w-full bg-[#f7f7f6]">
      <section className="mx-auto w-full max-w-[480px] px-4 py-14 sm:py-20">
        <h1 className="text-center text-[32px] font-semibold leading-[1.12] tracking-tight text-gray-900 sm:text-[36px]">
          {titre}
        </h1>
        <p className="mx-auto mt-3 max-w-[380px] text-pretty text-center text-[15.5px] leading-[1.5] text-gray-500">
          {sousTitre}
        </p>

        <div className="mt-8 rounded-3xl border border-gray-200/70 bg-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(17,17,17,.07),0_2px_6px_rgba(17,17,17,.04)]">
          {children}
        </div>

        {bas && <p className="mt-6 text-center text-sm text-gray-600">{bas}</p>}

        {/* Trois repères, et ce ne sont pas des promesses en l'air : le suivi
            existe (la Timeline des commandes), les 58 wilayas sont dans
            lib/wilayas.ts, et le paiement à la livraison est le seul mode de
            la plateforme. Ils disent à quoi sert un compte, ce qu'un
            formulaire seul ne dit jamais.

            L'espace vendeur n'aura jamais cette rangée : c'est un argument de
            boutique, pas de gestion. */}
        <ul className="mt-10 flex flex-col gap-3 border-t border-gray-200/70 pt-8 sm:flex-row sm:justify-center sm:gap-6 sm:border-0 sm:pt-9">
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
      </section>
    </div>
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
