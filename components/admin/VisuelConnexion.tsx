import { getTranslations } from "next-intl/server";

/**
 * Le panneau décoratif de la page de connexion marchand — ce qu'on aperçoit
 * « derrière le rideau ».
 *
 * Purement illustratif : aucun chiffre ne vient de la base. Ce sont des
 * valeurs plausibles, en dinars, avec des produits d'artisanat.
 *
 * Deux partis pris de la maquette qu'il ne faut pas « corriger » :
 *
 *  1. Les éléments débordent volontairement de la boîte (décalages négatifs).
 *     Ils sont coupés par les coins arrondis, ce qui donne l'impression d'un
 *     cadrage sur une interface plus grande. Un débordement rogné n'est pas
 *     un bug ici.
 *
 *  2. Les positions passent par `insetInlineStart` / `insetInlineEnd` plutôt
 *     que `left` / `right`. Ces propriétés logiques se retournent seules en
 *     arabe : la composition est le miroir exact de la version française, sans
 *     une seule règle dupliquée.
 *
 * Masqué sous 1180 px (voir la page) : sur un écran étroit, le formulaire
 * prend toute la place.
 */

/** Ombres de la maquette, reprises telles quelles. */
const OMBRE = {
  premierPlan: "0 20px 44px rgba(52,42,28,.13), 0 2px 5px rgba(52,42,28,.04)",
  flottant: "0 16px 36px rgba(52,42,28,.12), 0 2px 5px rgba(52,42,28,.04)",
  notification: "0 16px 36px rgba(52,42,28,.14), 0 2px 5px rgba(52,42,28,.04)",
  boite: "0 18px 44px rgba(52,42,28,.10), 0 2px 6px rgba(52,42,28,.04)",
} as const;

/** Icône panier, partagée avec la notification. */
function IconePanier({ taille, trait }: { taille: number; trait: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trait}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L20.5 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

/** Vase. Les détails intérieurs sont plus fins et plus pâles que la silhouette. */
function DessinVase({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M18 7h12l-1.5 6.5c4 2.8 6.5 7.4 6.5 12.6C35 34 30 41 24 41S13 34 13 26.1c0-5.2 2.5-9.8 6.5-12.6L18 7Z"
          strokeWidth={2.4}
        />
        <path d="M16.5 22c4.8 2.4 10.2 2.4 15 0" strokeWidth={1.8} opacity={0.45} />
        <path d="M17.5 31c4.2 1.9 8.8 1.9 13 0" strokeWidth={1.8} opacity={0.4} />
      </g>
    </svg>
  );
}

/** Sac cabas. */
function DessinSac({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 16h26l-2.5 24h-21L11 16Z" strokeWidth={2.4} />
        <path d="M18 16v-3a6 6 0 0 1 12 0v3" strokeWidth={2.4} />
        <path d="M15.5 24h17" strokeWidth={1.8} opacity={0.4} />
      </g>
    </svg>
  );
}

/** Chèche plié. */
function DessinCheche({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}>
        <rect x="8" y="14" width="32" height="20" rx="4" />
        <path d="M8 21h32M8 27h32" opacity={0.45} />
      </g>
    </svg>
  );
}

/** Pain de savon. */
function DessinSavon({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}>
        <rect x="9" y="16" width="30" height="17" rx="5" />
        <circle cx="24" cy="24.5" r="4.5" opacity={0.45} />
      </g>
    </svg>
  );
}

export default async function VisuelConnexion() {
  const t = await getTranslations("connexionMarchand.visuel");

  const heures = ["08 h", "11 h", "14 h", "17 h", "20 h"];

  const kpis = [
    [t("kpiCommandes"), t("kpiCommandesValeur")],
    [t("kpiPanier"), t("kpiPanierValeur")],
    [t("kpiConversion"), t("kpiConversionValeur")],
  ] as const;

  const commandes = [
    { Dessin: DessinVase, nom: t("produitVase"), prix: t("produitVasePrix"), fond: "#f8f5f0" },
    { Dessin: DessinCheche, nom: t("produitCheche"), prix: t("produitChechePrix"), fond: "#f2f4f2" },
    { Dessin: DessinSavon, nom: t("produitSavon"), prix: t("produitSavonPrix"), fond: "#f8f5f0" },
  ];

  const fiches = [
    { Dessin: DessinVase, nom: t("produitVase"), prix: t("produitVasePrix"), fond: "#f8f5f0" },
    { Dessin: DessinSac, nom: t("produitSac"), prix: t("produitSacPrix"), fond: "#f2f4f2" },
  ];

  return (
    <div
      // Décoratif de bout en bout : une description suffit, un lecteur d'écran
      // n'a pas à parcourir des chiffres inventés.
      role="img"
      aria-label={t("alt")}
      className="relative h-full w-full overflow-hidden rounded-[40px] bg-[#f7f4ef]"
      style={{ boxShadow: OMBRE.boite }}
    >
      {/* ── Carte « Ventes du jour » ─────────────────────────────────── */}
      <div
        className="absolute w-[452px] rounded-3xl bg-white px-[26px] py-6"
        style={{ insetInlineStart: -40, top: 56, zIndex: 1, boxShadow: OMBRE.premierPlan }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#0a0a0a]">{t("ventesTitre")}</span>
          <span className="text-[11.5px] font-medium text-[#8b8377]">{t("ventesDate")}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="font-[family-name:var(--police-titre)] text-[36px] font-medium leading-none tracking-[-.02em] text-[#0a0a0a]">
            {t("ventesMontant")}
          </span>
          <span className="text-[14px] font-medium text-[#8b8377]">{t("devise")}</span>
          <span className="rounded-md bg-[#eef3ec] px-[7px] py-[5px] text-[11.5px] font-semibold text-[#3f7d52]">
            {t("ventesEvolution")}
          </span>
        </div>

        {/* preserveAspectRatio="none" autorise la déformation horizontale :
            la courbe s'étire à la largeur de la carte, ce qui est voulu. */}
        <svg
          viewBox="0 0 400 86"
          preserveAspectRatio="none"
          className="mt-[18px] h-[86px] w-full"
          aria-hidden="true"
        >
          <path
            d="M0 66 L50 52 L100 58 L150 36 L200 44 L250 26 L300 33 L350 16 L400 9 L400 86 L0 86 Z"
            fill="rgba(10,10,10,.055)"
          />
          <path
            d="M0 66 L50 52 L100 58 L150 36 L200 44 L250 26 L300 33 L350 16 L400 9"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={400} cy={9} r={3.6} fill="#0a0a0a" />
        </svg>

        {/* dir="ltr" forcé : une courbe de temps ne se retourne pas avec la
            langue, l'heure la plus ancienne reste à gauche. */}
        <div className="mt-2 flex justify-between" dir="ltr">
          {heures.map((h) => (
            <span key={h} className="text-[10px] font-medium text-[#a9a196]">
              {h}
            </span>
          ))}
        </div>

        <div className="mt-[22px] grid grid-cols-3 gap-3 border-t border-[#f4f1eb] pt-5">
          {kpis.map(([label, valeur]) => (
            <div key={label} className="flex flex-col gap-[7px]">
              <span className="text-[11px] font-medium text-[#8b8377]">{label}</span>
              <span className="text-[17px] font-semibold text-[#0a0a0a]">{valeur}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notification ─────────────────────────────────────────────── */}
      <div
        className="absolute flex w-[330px] items-center gap-[13px] rounded-[18px] bg-white px-4 py-3.5"
        style={{ insetInlineEnd: -34, top: 382, zIndex: 3, boxShadow: OMBRE.notification }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-white">
          <IconePanier taille={18} trait={1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="text-[13px] font-semibold text-[#0a0a0a]">{t("notifTitre")}</span>
          <span className="truncate text-[12px] leading-[1.25] text-[#6b6257]">
            {t("notifDetail")}
          </span>
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#3f9b58]" />
      </div>

      {/* ── Dernières commandes ──────────────────────────────────────── */}
      <div
        className="absolute w-[300px] rounded-[20px] bg-white px-5 py-[18px]"
        style={{ insetInlineEnd: -28, top: 462, zIndex: 2, boxShadow: OMBRE.flottant }}
      >
        <span className="text-[13px] font-semibold text-[#0a0a0a]">{t("commandesTitre")}</span>
        <ul className="mt-[15px] flex flex-col gap-[13px]">
          {commandes.map(({ Dessin, nom, prix, fond }) => (
            <li key={nom} className="flex items-center gap-[11px]">
              <span
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: fond }}
              >
                <Dessin taille={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium leading-[1.2] text-[#0a0a0a]">
                {nom}
              </span>
              <span className="shrink-0 text-[12.5px] font-medium text-[#6b6257]">{prix}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Fiches produit ───────────────────────────────────────────── */}
      <div
        className="absolute flex gap-3.5"
        style={{ insetInlineStart: 40, bottom: -58, zIndex: 4 }}
      >
        {fiches.map(({ Dessin, nom, prix, fond }) => (
          <div
            key={nom}
            className="w-[178px] rounded-[20px] bg-white p-[13px]"
            style={{ boxShadow: OMBRE.premierPlan }}
          >
            {/* Une vraie photo produit prendrait exactement cette place, en
                object-cover et au même radius. C'est le seul endroit du visuel
                où une image bitmap aurait du sens. */}
            <div
              className="flex h-[152px] items-center justify-center rounded-[13px]"
              style={{ background: fond }}
            >
              <Dessin taille={92} />
            </div>
            <div className="flex flex-col gap-1.5 px-1 pb-1 pt-[13px]">
              <span className="truncate text-[13px] font-medium leading-[1.25] text-[#0a0a0a]">
                {nom}
              </span>
              <span className="text-[12.5px] font-medium text-[#6b6257]">{prix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
