import { OMBRE } from "@/components/admin/visuel/jetons";
import PanneauEchelle from "@/components/admin/visuel/PanneauEchelle";

/**
 * Le panneau décoratif des écrans de compte CLIENT.
 *
 * Même artisanat que celui de l'espace vendeur — mêmes positions, mêmes
 * largeurs, mêmes ombres, même mise à l'échelle — mais il raconte l'histoire
 * INVERSE. Le vendeur voit ce qu'il encaisse ; le client voit ce qu'il reçoit.
 *
 *   vendeur                          client
 *   ─────────────────────────────    ────────────────────────────────
 *   Ventes du jour, courbe, KPIs     SA commande et son acheminement
 *   Nouvelle commande (une vente)    Colis en cours de livraison
 *   Dernières commandes + prix       SES commandes et leur état
 *   Fiches produit du catalogue      SES favoris
 *
 * Aucun chiffre d'affaires, aucun taux de conversion, aucune notion de vente :
 * ce sont des informations de gestion, elles n'ont rien à faire devant
 * quelqu'un qui vient chercher son colis.
 *
 * ⚠️ Le contenu est en ANGLAIS, comme le panneau vendeur : c'est une maquette
 * d'interface, pas du contenu. D'où `dir="ltr"` et `aria-hidden`, portés par
 * PanneauEchelle. C'est plus discutable ici que côté gestion — un acheteur
 * algérien n'est pas un back-office — et c'est le premier point à reprendre si
 * tu veux le localiser.
 */

/** Camion — le colis en route, dans la pastille de notification. */
function IconeLivraison() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M2.8 7.4 H12.2 V16.3 H2.8 Z M12.2 10.1 H16.1 L19 13 V16.3 H12.2 Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.7" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.6" cy="18" r="1.7" fill="none" stroke="#fff" strokeWidth="1.7" />
    </svg>
  );
}

/** Coche — une étape franchie, une commande livrée. */
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

/** Petit camion, pour la ligne « en route ». */
function IconeEnRoute() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M3.4 7.8 H12 V15.6 H3.4 Z M12 10.4 H15.6 L18.2 13 V15.6 H12 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Boîte fermée, pour la ligne « en préparation ». */
function IconePreparation() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M4.4 8.2 12 4.6 19.6 8.2 V15.8 L12 19.4 4.4 15.8 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.4 8.2 12 11.9 19.6 8.2" fill="none" stroke="#0a0a0a" strokeWidth="1.4" />
    </svg>
  );
}

/** Cœur — le marqueur des favoris. */
function IconeCoeur() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        d="M12 19.4 C6.6 16 4 13.3 4 10.3 C4 8 5.9 6.2 8.2 6.2 C9.7 6.2 11.1 7 12 8.3 C12.9 7 14.3 6.2 15.8 6.2 C18.1 6.2 20 8 20 10.3 C20 13.3 17.4 16 12 19.4 Z"
        fill="#b9552f"
        stroke="none"
      />
    </svg>
  );
}

/**
 * Montre-bracelet.
 *
 * Les deux dessins des favoris ne sont plus le cabas et le casque : ceux-ci
 * appartiennent au panneau VENDEUR, et les répéter ici donnait l'impression de
 * regarder deux fois la même maquette. Un objet personnel dit mieux « ce que
 * j'ai mis de côté » qu'un article de catalogue.
 */
function DessinMontre() {
  return (
    <svg viewBox="0 0 120 120" width="92" height="92" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <rect x="38" y="38" width="44" height="44" rx="12" strokeWidth="2.4" />
        <path d="M48 38 V24 C48 21.8 49.8 20 52 20 H68 C70.2 20 72 21.8 72 24 V38" strokeWidth="2.4" />
        <path d="M48 82 V96 C48 98.2 49.8 100 52 100 H68 C70.2 100 72 98.2 72 96 V82" strokeWidth="2.4" />
        <path d="M60 50 V60 H69" strokeWidth="1.8" opacity=".45" />
        <path d="M82 54 H87" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

/** Basket. */
function DessinBasket() {
  return (
    <svg viewBox="0 0 120 120" width="92" height="92" aria-hidden="true">
      <g stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path
          d="M20 86 C20 81.6 23.6 78 28 78 H92 C97.5 78 102 82.5 102 88 C102 92.4 98.4 96 94 96 H30 C24.5 96 20 91.5 20 86 Z"
          strokeWidth="2.4"
        />
        <path
          d="M28 78 V58 C28 51.4 33.4 46 40 46 H50 L70 64 H86 C94.8 64 102 71.2 102 80"
          strokeWidth="2.4"
        />
        <path d="M44 54 L54 62 M52 48 L62 57" strokeWidth="1.8" opacity=".4" />
      </g>
    </svg>
  );
}

/** Les trois étapes de l'acheminement. La deuxième est celle en cours. */
const ETAPES = [
  { libelle: "Confirmed", faite: true },
  { libelle: "On the way", faite: true, courante: true },
  { libelle: "Delivered", faite: false },
];

const COMMANDES = [
  { Icone: IconeCoche, nom: "Silicone corner guards", etat: "Delivered" },
  { Icone: IconeEnRoute, nom: "Classic wristwatch", etat: "On the way" },
  { Icone: IconePreparation, nom: "Car suction mount", etat: "Preparing" },
];

const FAVORIS = [
  { Dessin: DessinMontre, nom: "Classic wristwatch", prix: "12 500 DA" },
  { Dessin: DessinBasket, nom: "Canvas sneakers", prix: "7 200 DA" },
];

export default function VisuelCompteClient() {
  return (
    <PanneauEchelle>
      {/* ══ Carte 1 — la commande en cours ═══════════════════════════════
          Même gabarit que « Today's sales » côté vendeur : largeur 452,
          débord de 40 à gauche, retrait latéral de 26. */}
      <div
        className="absolute left-[-40px] top-[56px] z-[1] w-[452px] rounded-3xl bg-white px-[26px] py-6"
        style={{ boxShadow: OMBRE.principale }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold leading-none text-[#0a0a0a]">
            Your order
          </span>
          <span className="text-[11.5px] font-medium leading-none text-[#8b8377]">
            Mon 28 Aug
          </span>
        </div>

        {/* Le montant est celui que le client A PAYÉ, pas un chiffre
            d'affaires. La même valeur ne dit pas la même chose des deux côtés. */}
        <div className="mt-4 flex items-baseline gap-2.5">
          <span
            className="text-[36px] font-medium leading-none tracking-[-.02em] text-[#0a0a0a]"
            style={{ fontFamily: "var(--police-newsreader), Georgia, serif" }}
          >
            34 900
          </span>
          <span className="text-[14px] font-medium leading-none text-[#8b8377]">DA</span>
          <span className="rounded-md bg-[#eaf2ec] px-[7px] py-[5px] text-[11.5px] font-semibold leading-none text-[#2c6b45]">
            Free delivery
          </span>
        </div>

        {/* L'acheminement remplace la courbe de ventes. C'est l'équivalent
            client exact : ce que le vendeur suit en argent, le client le suit
            en distance. */}
        <div className="mt-[26px]">
          <div className="relative mx-[6px] h-[3px] rounded-full bg-[#f0ece5]">
            <div className="h-full w-1/2 rounded-full bg-[#2f7d4f]" />
            {ETAPES.map((e, i) => (
              <span
                key={e.libelle}
                className={`absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border-2 ${
                  e.faite
                    ? "border-[#2f7d4f] bg-[#2f7d4f]"
                    : "border-[#ded8ce] bg-white"
                }`}
                style={{ left: `${i * 50}%`, marginLeft: -5.5 }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            {ETAPES.map((e) => (
              <span
                key={e.libelle}
                className={`text-[11px] leading-none ${
                  e.courante
                    ? "font-semibold text-[#0a0a0a]"
                    : "font-medium text-[#8b8377]"
                }`}
              >
                {e.libelle}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-[22px] flex gap-3 border-t border-[#f4f1eb] pt-5">
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">Items</span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">3</span>
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Delivered to
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">
              Alger
            </span>
          </div>
          {/* Aligné à droite, comme la dernière colonne du panneau vendeur. */}
          <div className="flex flex-1 flex-col items-end gap-[7px]">
            <span className="text-[11px] font-medium leading-none text-[#8b8377]">
              Arrives
            </span>
            <span className="text-[17px] font-semibold leading-none text-[#0a0a0a]">
              Tomorrow
            </span>
          </div>
        </div>
      </div>

      {/* ══ Carte 3 — le colis en route ══════════════════════════════════ */}
      <div
        className="absolute right-[-34px] top-[382px] z-[3] flex w-[330px] items-center gap-[13px] rounded-[18px] bg-white px-4 py-3.5"
        style={{ boxShadow: OMBRE.notification }}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b9552f]">
          <IconeLivraison />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
            Out for delivery
          </span>
          <span className="text-[12px] leading-[1.25] text-[#6b6257]">
            Your parcel arrives tomorrow
          </span>
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9c2b6]" />
      </div>

      {/* ══ Carte 2 — l'historique ═══════════════════════════════════════
          Des ÉTATS, pas des prix : le client suit où en sont ses colis, le
          vendeur suit ce que chaque ligne lui a rapporté. */}
      <div
        className="absolute right-[-28px] top-[462px] z-[2] w-[300px] rounded-[20px] bg-white px-5 py-[18px]"
        style={{ boxShadow: OMBRE.liste }}
      >
        <div className="text-[13px] font-semibold leading-none text-[#0a0a0a]">
          Your orders
        </div>
        <div className="mt-[15px] flex flex-col gap-[13px]">
          {COMMANDES.map(({ Icone, nom, etat }) => (
            <div key={nom} className="flex items-center gap-[11px]">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f5f1ea]">
                <Icone />
              </span>
              <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-[1.2] text-[#0a0a0a]">
                {nom}
              </span>
              <span className="shrink-0 text-[12.5px] font-medium leading-none text-[#6b6257]">
                {etat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Carte 4 — les favoris ════════════════════════════════════════
          Le cœur en terracotta suffit à dire que ces produits sont ceux du
          CLIENT, et non deux articles du catalogue. */}
      <div className="absolute bottom-[-58px] left-[40px] z-[4] flex gap-3.5">
        {FAVORIS.map(({ Dessin, nom, prix }) => (
          <div
            key={nom}
            className="w-[178px] rounded-[20px] bg-white p-[13px]"
            style={{ boxShadow: OMBRE.produits }}
          >
            <div className="relative grid h-[152px] place-items-center rounded-[13px] bg-[#f5f1ea]">
              <Dessin />
              <span className="absolute right-2.5 top-2.5 grid h-[26px] w-[26px] place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(52,42,28,.14)]">
                <IconeCoeur />
              </span>
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
    </PanneauEchelle>
  );
}
