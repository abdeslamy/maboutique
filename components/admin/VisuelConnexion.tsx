import { OMBRE, Panneau } from "@/components/admin/visuel/jetons";

/**
 * Le panneau décoratif de la page de connexion marchand — ce qu'on aperçoit
 * « derrière le rideau ».
 *
 * Entièrement en SVG et en texte. C'était une image auparavant : quelle que
 * soit sa définition, elle finissait toujours par être agrandie sur un écran
 * dense. Ici il n'y a plus rien à agrandir, le rendu est net à toute taille et
 * à toute densité.
 *
 * ── Trois règles à ne pas « corriger » ─────────────────────────────────────
 *
 * 1. Les cartes débordent VOLONTAIREMENT du panneau (décalages négatifs), et
 *    `overflow-hidden` les fait rogner par les coins arrondis. Ce rognage EST
 *    le dessin : il donne l'impression d'un cadrage sur une interface plus
 *    grande. La troisième ligne de « Latest orders » n'est qu'à moitié
 *    visible, c'est voulu.
 *
 * 2. La courbe n'a AUCUN repère d'axe. Ni heures, ni grille, ni infobulle.
 *
 * 3. L'ordre de superposition compte : fiches produit (4) au-dessus de la
 *    notification (3), au-dessus des commandes (2), au-dessus des ventes (1).
 *
 * ── Deux points propres à ce projet, absents de la spec ────────────────────
 *
 * Le contenu est en ANGLAIS et le reste dans les deux langues : c'est une
 * maquette d'interface, pas du contenu. D'où `dir="ltr"`, sans quoi les cartes
 * se retourneraient en arabe et les libellés anglais seraient mal composés.
 *
 * D'où aussi `aria-hidden`. Des chiffres inventés, dans une langue qui n'est
 * pas celle de la page, n'ont rien à annoncer à un lecteur d'écran.
 *
 * Masqué sous 1200 px : sur un écran étroit, le formulaire prend toute la
 * place. Aucune tentative de réagencer ces cartes.
 */

// ── Icônes ────────────────────────────────────────────────────────────────
// Tracés repris mot pour mot de la spec. Aucune bibliothèque d'icônes : les
// épaisseurs de trait (1,4 / 1,6 / 1,8 / 2,2 / 2,4 px) et le calage optique ne
// se retrouveraient pas.

/** Cabas, dans la pastille de notification. Trait blanc sur fond terracotta. */
function IconeSacNotif() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6.4 8.2 H17.6 C18.9 8.2 19.8 9.1 20 10.4 L20.6 16.6 C20.8 18.7 19.6 20 17.5 20 H6.5 C4.4 20 3.2 18.7 3.4 16.6 L4 10.4 C4.2 9.1 5.1 8.2 6.4 8.2 Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.4 V6.9 C9 5.3 10.3 4 12 4 C13.7 4 15 5.3 15 6.9 V8.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeVase() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M10 4.6 H14 V7 C16.4 8 18 10.2 18 13 V17.2 C18 18.8 16.9 19.8 15.3 19.8 H8.7 C7.1 19.8 6 18.8 6 17.2 V13 C6 10.2 7.6 8 10 7 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCheche() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M4.8 8 C8 6.4 16 6.4 19.2 8 C17.6 11.4 17.6 14.6 19.2 18 C16 16.4 8 16.4 4.8 18 C6.4 14.6 6.4 11.4 4.8 8 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSavon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect
        x="5.4"
        y="7.4"
        width="13.2"
        height="9.2"
        rx="2.4"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.4"
      />
      <path d="M9 7.6 L9 16.4" fill="none" stroke="#0a0a0a" strokeWidth="1.4" />
    </svg>
  );
}

/** Cabas, grand format, sur la plaque de la première fiche produit. */
function DessinSac() {
  return (
    <svg viewBox="0 0 120 120" width="92" height="92" aria-hidden="true">
      <path
        d="M32 42 H88 C90.8 42 93 44.3 92.7 47.1 L88.4 96.6 C87.7 103.2 82.6 108 76 108 H44 C37.4 108 32.3 103.2 31.6 96.6 L27.3 47.1 C27 44.3 29.2 42 32 42 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M45 52 V32 C45 23.7 51.7 17 60 17 C68.3 17 75 23.7 75 32 V52"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M27.6 56 H92.4" fill="none" stroke="#0a0a0a" strokeWidth="1.6" opacity=".26" />
      <path
        d="M52 74 H68"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".38"
      />
    </svg>
  );
}

/** Casque, sur la plaque de la seconde fiche produit. */
function DessinCasque() {
  return (
    <svg viewBox="0 0 120 120" width="92" height="92" aria-hidden="true">
      <path
        d="M26 66 V56 C26 37.2 41.2 22 60 22 C78.8 22 94 37.2 94 56 V66"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M26 66 H34 C37.3 66 40 68.7 40 72 V90 C40 93.3 37.3 96 34 96 H30 C27.8 96 26 94.2 26 92 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M94 66 H86 C82.7 66 80 68.7 80 72 V90 C80 93.3 82.7 96 86 96 H90 C92.2 96 94 94.2 94 92 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M50 84 H70"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".38"
      />
    </svg>
  );
}

// ── Le panneau ────────────────────────────────────────────────────────────

const COMMANDES = [
  { Icone: IconeVase, nom: "Terracotta vase", prix: "5,900 DA" },
  { Icone: IconeCheche, nom: "Indigo cotton scarf", prix: "3,400 DA" },
  { Icone: IconeSavon, nom: "Aleppo soap", prix: "1,200 DA" },
];

const PRODUITS = [
  { Dessin: DessinSac, nom: "Premium shopping bag", prix: "3,400 DA" },
  { Dessin: DessinCasque, nom: "Wireless headphones", prix: "18,900 DA" },
];

export default function VisuelConnexion() {
  return (
    <Panneau>
      {/* ══ Carte 1 — Today's sales ═══════════════════════════════════════
          Alignement à préserver : la zone de contenu fait 400 px (452 − 2×26)
          et le SVG fait exactement 400. La fin de la courbe, le bord droit de
          « Mon 28 Aug » et celui de « 7.2% » tombent donc sur la même
          verticale. Changer la largeur, le retrait latéral ou la largeur du
          SVG casse ce calage. */}
      <div
        className="absolute left-[-40px] top-[56px] z-[1] w-[452px] rounded-3xl bg-white px-[26px] py-6"
        style={{ boxShadow: OMBRE.principale }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold leading-none text-[#0a0a0a]">
            Today&apos;s sales
          </span>
          <span className="text-[11.5px] font-medium leading-none text-[#8b8377]">
            Mon 28 Aug
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2.5">
          <span
            className="text-[36px] font-medium leading-none tracking-[-.02em] text-[#0a0a0a]"
            // Newsreader directement, et non la variable de titre de la page :
            // celle-ci bascule sur Cairo en arabe, or ce nombre est latin.
            style={{ fontFamily: "var(--police-newsreader), Georgia, serif" }}
          >
            42,180
          </span>
          <span className="text-[14px] font-medium leading-none text-[#8b8377]">DA</span>
          <span className="rounded-md bg-[#eaf2ec] px-[7px] py-[5px] text-[11.5px] font-semibold leading-none text-[#2c6b45]">
            +14.8%
          </span>
        </div>

        <svg
          viewBox="0 0 400 86"
          width="400"
          height="86"
          preserveAspectRatio="none"
          className="mt-[18px] block"
        >
          <defs>
            <linearGradient id="courbe-ventes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(47,125,79,.20)" />
              <stop offset="100%" stopColor="rgba(47,125,79,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0 66 L50 52 L100 58 L150 36 L200 44 L250 26 L300 33 L350 16 L400 9 L400 86 L0 86 Z"
            fill="url(#courbe-ventes)"
          />
          <path
            d="M0 66 L50 52 L100 58 L150 36 L200 44 L250 26 L300 33 L350 16 L400 9"
            fill="none"
            stroke="#2f7d4f"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="396" cy="9.9" r="4" fill="#2f7d4f" />
        </svg>

        <div className="mt-[22px] flex gap-3 border-t border-[#f4f1eb] pt-5">
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">Orders</span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">38</span>
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Average order
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">
              1,110 DA
            </span>
          </div>
          {/* Aligné à droite : c'est ce qui fait tomber « 7.2% » sur la même
              verticale que la fin de la courbe. */}
          <div className="flex flex-1 flex-col items-end gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Conversion
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">7.2%</span>
          </div>
        </div>
      </div>

      {/* ══ Carte 3 — New order ══════════════════════════════════════════ */}
      <div
        className="absolute right-[-34px] top-[382px] z-[3] flex w-[330px] items-center gap-[13px] rounded-[18px] bg-white px-4 py-3.5"
        style={{ boxShadow: OMBRE.notification }}
      >
        {/* Seule touche chaude de tout le panneau. */}
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b9552f]">
          <IconeSacNotif />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
            New order
          </span>
          <span className="text-[12px] leading-[1.25] text-[#6b6257]">
            Indigo cotton scarf · 3,400 DA
          </span>
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9c2b6]" />
      </div>

      {/* ══ Carte 2 — Latest orders ══════════════════════════════════════
          Rognée par le bas du panneau : la troisième ligne n'apparaît qu'à
          moitié. Ne pas raccourcir la liste pour « arranger » ça. */}
      <div
        className="absolute right-[-28px] top-[462px] z-[2] w-[300px] rounded-[20px] bg-white px-5 py-[18px]"
        style={{ boxShadow: OMBRE.liste }}
      >
        <div className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
          Latest orders
        </div>
        <div className="mt-[15px] flex flex-col gap-[13px]">
          {COMMANDES.map(({ Icone, nom, prix }) => (
            <div key={nom} className="flex items-center gap-[11px]">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f5f1ea]">
                <Icone />
              </span>
              <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-[1.2] text-[#0a0a0a]">
                {nom}
              </span>
              <span className="shrink-0 text-[12.5px] font-medium leading-none text-[#6b6257]">
                {prix}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Carte 4 — les deux fiches produit ════════════════════════════ */}
      <div className="absolute bottom-[-58px] left-[40px] z-[4] flex gap-3.5">
        {PRODUITS.map(({ Dessin, nom, prix }) => (
          <div
            key={nom}
            className="w-[178px] rounded-[20px] bg-white p-[13px]"
            style={{ boxShadow: OMBRE.produits }}
          >
            <div className="grid h-[152px] place-items-center rounded-[13px] bg-[#f5f1ea]">
              <Dessin />
            </div>
            <div className="flex flex-col gap-1.5 px-1 pb-1 pt-[13px]">
              <span className="text-[13px] font-medium leading-[1.25] text-[#0a0a0a]">
                {nom}
              </span>
              <span className="text-[12.5px] font-medium leading-none text-[#6b6257]">
                {prix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panneau>
  );
}
