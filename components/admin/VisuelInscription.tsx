import { OMBRE, Panneau } from "@/components/admin/visuel/jetons";

/**
 * Le panneau décoratif de l'OUVERTURE de boutique.
 *
 * Même système que celui de la connexion — mêmes positions, mêmes largeurs,
 * mêmes ombres, même ordre de superposition. Seul le CONTENU change, et il
 * raconte autre chose : une boutique qui se monte, pas une boutique qui
 * tourne.
 *
 * Trois traductions de cette idée :
 *
 *  - la carte principale ne montre aucun chiffre de vente. Il n'y en a pas
 *    encore. Elle montre l'avancement de la configuration, et le nom de la
 *    boutique à la place du montant ;
 *  - la liste n'est plus « dernières commandes » mais « prochaines étapes »,
 *    dont une reste à faire ;
 *  - des deux fiches produit, la seconde est VIDE — un emplacement en
 *    pointillés qui attend le produit suivant. C'est le signal le plus direct
 *    d'une boutique en train de naître.
 *
 * Les débordements négatifs et le rognage par les coins arrondis sont
 * identiques à l'autre panneau : c'est le dessin, pas un défaut.
 */

// ── Icônes ────────────────────────────────────────────────────────────────
// Mêmes épaisseurs de trait que l'autre panneau (1,4 / 1,8 / 2,4). Aucune
// bibliothèque : le calage optique ne se retrouverait pas.

/** Étincelle — la boutique qui prend vie, dans la pastille de notification. */
function IconeEtincelle() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3.4 L13.9 9.1 L19.6 11 L13.9 12.9 L12 18.6 L10.1 12.9 L4.4 11 L10.1 9.1 Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Coche, pour les étapes franchies. */
function IconeCoche() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M6.5 12.4 L10.2 16 L17.5 8.4"
        fill="none"
        stroke="#2f7d4f"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Cercle vide, pour l'étape qui reste. */
function IconeAFaire() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="5.6"
        fill="none"
        stroke="#8b8377"
        strokeWidth="1.4"
        strokeDasharray="2.6 2.4"
      />
    </svg>
  );
}

/** Cabas, grand format, sur la plaque du premier produit. */
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

/** Le « plus » de l'emplacement vide. Trait plus fin : il appelle, il ne pèse pas. */
function DessinAjout() {
  return (
    <svg viewBox="0 0 120 120" width="92" height="92" aria-hidden="true">
      <path
        d="M60 40 V80 M40 60 H80"
        fill="none"
        stroke="#8b8377"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ETAPES = [
  { Icone: IconeCoche, texte: "Store name", faite: true },
  { Icone: IconeCoche, texte: "First product", faite: true },
  { Icone: IconeAFaire, texte: "Delivery rates", faite: false },
];

export default function VisuelInscription() {
  return (
    <Panneau>
      {/* ══ Carte 1 — la boutique en préparation ═════════════════════════
          Même gabarit que « Today's sales » : largeur 452, débord de 40 à
          gauche, retrait latéral de 26. La zone de contenu fait donc 400 px,
          comme sur l'autre panneau. */}
      <div
        className="absolute left-[-40px] top-[56px] z-[1] w-[452px] rounded-3xl bg-white px-[26px] py-6"
        style={{ boxShadow: OMBRE.principale }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold leading-none text-[#0a0a0a]">
            Your store
          </span>
          <span className="text-[11.5px] font-medium leading-none text-[#8b8377]">
            Almost ready
          </span>
        </div>

        {/* Le nom de la boutique prend la place du montant : à ce stade,
            c'est LUI l'information. */}
        <div className="mt-4 flex items-baseline gap-2.5">
          <span
            className="text-[36px] font-medium leading-none tracking-[-.02em] text-[#0a0a0a]"
            // Newsreader directement, et non la variable de titre de la page :
            // celle-ci bascule sur Cairo en arabe, or ce nom est latin.
            style={{ fontFamily: "var(--police-newsreader), Georgia, serif" }}
          >
            Tyradam
          </span>
          <span className="rounded-md bg-[#eaf2ec] px-[7px] py-[5px] text-[11.5px] font-semibold leading-none text-[#2c6b45]">
            2 of 3
          </span>
        </div>

        {/* Une barre d'avancement remplace la courbe. Une courbe de ventes
            n'aurait rien à tracer : il n'y a pas encore une seule commande. */}
        <div className="mt-[18px] h-1.5 w-full overflow-hidden rounded-full bg-[#f0ece5]">
          <div className="h-full w-[66%] rounded-full bg-[#2f7d4f]" />
        </div>

        <div className="mt-[18px] flex flex-col gap-3">
          {ETAPES.map(({ Icone, texte, faite }) => (
            <div key={texte} className="flex items-center gap-[11px]">
              <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg bg-[#f5f1ea]">
                <Icone />
              </span>
              <span
                className={`text-[12.5px] font-medium leading-none ${
                  faite ? "text-[#0a0a0a]" : "text-[#8b8377]"
                }`}
              >
                {texte}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[22px] flex gap-3 border-t border-[#f4f1eb] pt-5">
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Products
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">1</span>
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Store address
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">
              Reserved
            </span>
          </div>
          {/* Aligné à droite, comme « Conversion » sur l'autre panneau : c'est
              ce qui fait tomber la dernière valeur sur le bord de la zone. */}
          <div className="flex flex-1 flex-col items-end gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">Setup</span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">66%</span>
          </div>
        </div>
      </div>

      {/* ══ Carte 3 — le premier produit vient d'apparaître ══════════════ */}
      <div
        className="absolute right-[-34px] top-[382px] z-[3] flex w-[330px] items-center gap-[13px] rounded-[18px] bg-white px-4 py-3.5"
        style={{ boxShadow: OMBRE.notification }}
      >
        {/* Seule touche chaude de tout le panneau, comme sur la connexion. */}
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b9552f]">
          <IconeEtincelle />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
            First product added
          </span>
          <span className="text-[12px] leading-[1.25] text-[#6b6257]">
            Terracotta vase · 5,900 DA
          </span>
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9c2b6]" />
      </div>

      {/* ══ Carte 2 — ce qu'il reste à faire ═════════════════════════════
          Rognée par le bas du panneau : la troisième ligne n'apparaît qu'à
          moitié. Ne pas raccourcir la liste pour « arranger » ça. */}
      <div
        className="absolute right-[-28px] top-[462px] z-[2] w-[300px] rounded-[20px] bg-white px-5 py-[18px]"
        style={{ boxShadow: OMBRE.liste }}
      >
        <div className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
          Next steps
        </div>
        <div className="mt-[15px] flex flex-col gap-[13px]">
          {[
            ["Add two more products", "5 min"],
            ["Set delivery rates", "3 min"],
            ["Publish your store", "1 min"],
          ].map(([etape, duree]) => (
            <div key={etape} className="flex items-center gap-[11px]">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f5f1ea]">
                <IconeAFaire />
              </span>
              <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-[1.2] text-[#0a0a0a]">
                {etape}
              </span>
              <span className="shrink-0 text-[12.5px] font-medium leading-none text-[#6b6257]">
                {duree}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Carte 4 — un produit, et une place qui attend ════════════════ */}
      <div className="absolute bottom-[-58px] left-[40px] z-[4] flex gap-3.5">
        <div
          className="w-[178px] rounded-[20px] bg-white p-[13px]"
          style={{ boxShadow: OMBRE.produits }}
        >
          <div className="grid h-[152px] place-items-center rounded-[13px] bg-[#f5f1ea]">
            <DessinSac />
          </div>
          <div className="flex flex-col gap-1.5 px-1 pb-1 pt-[13px]">
            <span className="text-[13px] font-medium leading-[1.25] text-[#0a0a0a]">
              Premium shopping bag
            </span>
            <span className="text-[12.5px] font-medium leading-none text-[#6b6257]">
              3,400 DA
            </span>
          </div>
        </div>

        {/* L'emplacement vide. Pas d'ombre, un trait en pointillés, un fond de
            panneau : il se lit comme une place à prendre et non comme une
            carte à part entière. */}
        <div className="w-[178px] rounded-[20px] border border-dashed border-[#ded8ce] bg-[#fcfaf6] p-[13px]">
          <div className="grid h-[152px] place-items-center rounded-[13px] border border-dashed border-[#e2ddd4]">
            <DessinAjout />
          </div>
          <div className="flex flex-col gap-1.5 px-1 pb-1 pt-[13px]">
            <span className="text-[13px] font-medium leading-[1.25] text-[#8b8377]">
              Add your next product
            </span>
            <span className="text-[12.5px] font-medium leading-none text-[#a49c91]">—</span>
          </div>
        </div>
      </div>
    </Panneau>
  );
}
