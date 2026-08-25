"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as EvenementPointeur,
  type RefObject,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useProducts } from "@/context/ProductsContext";
import { formatPrix } from "@/lib/format";
import {
  ajouterRecente,
  contient,
  correctionProche,
  decouper,
  ecrireRecentes,
  lireRecentes,
} from "@/lib/recherche";
import type { Produit } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { Croix, Loupe } from "./IconesRecherche";

/**
 * Overlay de recherche — mobile, tablette et desktop.
 *
 * Toutes les valeurs chiffrées viennent du document de spécification et sont
 * écrites en dur. Elles ne sont volontairement PAS traduites dans l'échelle
 * Tailwind : arrondir 14,5 px à 14 ou 22 px à 24 casserait les alignements
 * calculés dans le document.
 *
 * Trois formats, aux paliers du document :
 *   < 768 px          → panneau flottant pleine largeur, poignée de drag
 *   768 – 1023 px     → panneau ancré, une colonne, croix de fermeture
 *   >= 1024 px        → panneau ancré, deux colonnes, navigation clavier
 *
 * L'overlay reste MONTÉ en permanence (opacité 0 quand il est fermé) : le
 * champ doit exister dans le DOM au moment du tap pour que le clavier iOS
 * s'ouvre. Voir le commentaire dans RechercheContext.
 */

type Format = "mobile" | "tablette" | "desktop";

const COURBE_PANNEAU = "cubic-bezier(.2,.85,.25,1)";
const COURBE_FOND = "cubic-bezier(.2,.8,.2,1)";

/** Placeholder d'image du document — rayures à 135°. */
const RAYURES =
  "repeating-linear-gradient(135deg,#EFEEEA 0 6px,#F7F6F3 6px 12px)";

/** Une entrée navigable au clavier (flèches haut / bas). */
type Entree =
  | { type: "suggestion"; texte: string }
  | { type: "produit"; produit: Produit }
  | { type: "tous" };

type Props = {
  ouvert: boolean;
  fermer: () => void;
  categories: { id: string; nomFr: string; nomAr: string }[];
  refRacine: RefObject<HTMLDivElement | null>;
  refChamp: RefObject<HTMLInputElement | null>;
};

export default function OverlayRecherche({
  ouvert,
  fermer,
  categories,
  refRacine,
  refChamp,
}: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("recherche");
  const router = useRouter();
  const { produits } = useProducts();

  const [requete, setRequete] = useState("");
  const [recentes, setRecentes] = useState<string[]>([]);
  const [format, setFormat] = useState<Format>("mobile");
  const [hauteurMax, setHauteurMax] = useState<number | null>(null);
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const [glissement, setGlissement] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const [indexActif, setIndexActif] = useState(-1);
  /** Le survol s'efface tant que la navigation clavier est active. */
  const [clavierActif, setClavierActif] = useState(false);

  const refPanneau = useRef<HTMLDivElement | null>(null);

  // ── Format d'affichage ────────────────────────────────────────────
  useEffect(() => {
    const tablette = window.matchMedia("(min-width: 768px)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    function maj() {
      setFormat(
        desktop.matches ? "desktop" : tablette.matches ? "tablette" : "mobile"
      );
    }
    maj();
    tablette.addEventListener("change", maj);
    desktop.addEventListener("change", maj);
    return () => {
      tablette.removeEventListener("change", maj);
      desktop.removeEventListener("change", maj);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setMouvementReduit(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);

  // ── Historique ────────────────────────────────────────────────────
  useEffect(() => setRecentes(lireRecentes()), []);

  const memoriser = useCallback((q: string) => {
    setRecentes((liste) => {
      const suivante = ajouterRecente(liste, q);
      ecrireRecentes(suivante);
      return suivante;
    });
  }, []);

  // ── Hauteur maximale du panneau ───────────────────────────────────
  // Le document fixe 258 px de clavier ; il signale lui-même que cette
  // constante dérive en réel (barre de suggestions, clavier tiers, paysage).
  // On lit donc `visualViewport`, qui rétrécit quand le clavier s'ouvre :
  // la formule du document (844 − 56 − 258 − 12 = 518) en découle toute seule.
  useEffect(() => {
    if (!ouvert) return;
    const vv = window.visualViewport;
    function maj() {
      const hauteur = vv ? vv.height : window.innerHeight;
      if (format === "mobile") {
        setHauteurMax(Math.max(200, hauteur - 56 - 12));
      } else {
        setHauteurMax(Math.min(620, Math.max(240, hauteur - 76 - 48)));
      }
    }
    maj();
    vv?.addEventListener("resize", maj);
    window.addEventListener("resize", maj);
    return () => {
      vv?.removeEventListener("resize", maj);
      window.removeEventListener("resize", maj);
    };
  }, [ouvert, format]);

  // ── Gel de la page ────────────────────────────────────────────────
  // `overscroll-behavior: contain` ne suffit pas sur iOS Safari : il faut
  // aussi figer la page. On mémorise le scrollTop et on le restaure à la
  // fermeture, sinon la page se retrouve revenue en haut.
  useEffect(() => {
    if (!ouvert) return;
    const y = window.scrollY;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    const gouttiere = html.style.scrollbarGutter;
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    return () => {
      html.style.overflow = overflow;
      html.style.scrollbarGutter = gouttiere;
      window.scrollTo(0, y);
    };
  }, [ouvert]);

  // À la fermeture, on vide le champ — mais après le fondu, pour que le
  // contenu ne saute pas sous les yeux pendant que le panneau s'efface.
  useEffect(() => {
    if (ouvert) return;
    const delai = window.setTimeout(
      () => {
        setRequete("");
        setIndexActif(-1);
        setGlissement(0);
        // Sans cette remise à zéro, le garde-fou du tap sur la poignée
        // resterait armé par le dernier glissement et le tap suivant
        // n'aurait aucun effet.
        geste.current.deplacement = 0;
      },
      format === "mobile" ? 280 : 160
    );
    return () => window.clearTimeout(delai);
  }, [ouvert, format]);

  // ── Données dérivées ──────────────────────────────────────────────
  const libelleCategorie = useCallback(
    (c: { nomFr: string; nomAr: string }) =>
      locale === "ar" ? c.nomAr : c.nomFr,
    [locale]
  );

  /** Rayon d'un produit, en toutes lettres — sert de qualificatif. */
  const rayonDe = useCallback(
    (p: Produit) => {
      const c = categories.find((x) => x.id === p.categorie);
      return c ? libelleCategorie(c) : "";
    },
    [categories, libelleCategorie]
  );

  const q = requete.trim();

  const resultats = useMemo(() => {
    if (!q) return [];
    // Nom + rayon : c'est l'équivalent du « nom + marque » du document,
    // la marque n'existant pas dans notre modèle produit.
    return produits.filter((p) =>
      contient(`${p.nom[locale]} ${rayonDe(p)}`, q)
    );
  }, [q, produits, locale, rayonDe]);

  /** Corpus de complétion : noms de produits + noms de rayons. */
  const corpus = useMemo(() => {
    const termes = [
      ...produits.map((p) => p.nom[locale]),
      ...categories.map(libelleCategorie),
    ];
    return Array.from(new Set(termes.filter(Boolean)));
  }, [produits, categories, locale, libelleCategorie]);

  const maxSuggestions = format === "desktop" ? 8 : 3;
  const suggestions = useMemo(() => {
    if (!q) return [];
    return corpus.filter((s) => contient(s, q)).slice(0, maxSuggestions);
  }, [q, corpus, maxSuggestions]);

  const chipsRayons = useMemo(() => {
    if (!q) return [];
    return categories
      .filter((c) => contient(libelleCategorie(c), q))
      .slice(0, 4);
  }, [q, categories, libelleCategorie]);

  const correction = useMemo(
    () => (q ? correctionProche(q, corpus) : null),
    [q, corpus]
  );

  const premierUsage = recentes.length === 0;
  const enSaisie = q.length > 0;
  const aucunResultat = enSaisie && resultats.length === 0;

  /** Vitrine : le document promet « populaires », nous n'avons pas la donnée. */
  const vitrine = useMemo(
    () => produits.slice(0, format === "mobile" ? 4 : 6),
    [produits, format]
  );

  const maxResultats = format === "desktop" ? 8 : resultats.length;
  const resultatsAffiches = resultats.slice(0, maxResultats);

  // ── Liste plate pour les flèches haut / bas ───────────────────────
  const entrees = useMemo<Entree[]>(() => {
    if (!enSaisie) return [];
    const liste: Entree[] = suggestions.map((texte) => ({
      type: "suggestion" as const,
      texte,
    }));
    for (const produit of resultatsAffiches) liste.push({ type: "produit", produit });
    if (resultats.length > resultatsAffiches.length) liste.push({ type: "tous" });
    return liste;
  }, [enSaisie, suggestions, resultatsAffiches, resultats.length]);

  // Toute modification de la requête remet la sélection à zéro : garder
  // l'index ferait pointer la sélection sur un autre produit.
  useEffect(() => setIndexActif(-1), [requete]);

  // ── Actions ───────────────────────────────────────────────────────
  const allerVersCatalogue = useCallback(
    (terme: string) => {
      memoriser(terme);
      fermer();
      router.push(`/produits?q=${encodeURIComponent(terme)}`);
    },
    [memoriser, fermer, router]
  );

  const ouvrirProduit = useCallback(
    (produit: Produit, nouvelOnglet = false) => {
      if (q) memoriser(q);
      if (nouvelOnglet) {
        window.open(
          `/${locale}/produits/${produit.id}`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }
      fermer();
      router.push(`/produits/${produit.id}`);
    },
    [q, memoriser, fermer, router, locale]
  );

  const activer = useCallback(
    (entree: Entree, nouvelOnglet = false) => {
      if (entree.type === "suggestion") {
        setRequete(entree.texte);
        refChamp.current?.focus();
        return;
      }
      if (entree.type === "produit") {
        ouvrirProduit(entree.produit, nouvelOnglet);
        return;
      }
      allerVersCatalogue(q);
    },
    [ouvrirProduit, allerVersCatalogue, q, refChamp]
  );

  // ── Clavier ───────────────────────────────────────────────────────
  function surToucheChamp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      // Premier Échap : efface. Second : ferme.
      if (requete) setRequete("");
      else fermer();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (entrees.length === 0) return;
      e.preventDefault();
      setClavierActif(true);
      setIndexActif((i) => {
        const pas = e.key === "ArrowDown" ? 1 : -1;
        const suivant = i + pas;
        if (suivant < 0) return entrees.length - 1;
        if (suivant >= entrees.length) return 0;
        return suivant;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const entree = entrees[indexActif];
      if (entree) activer(entree, e.metaKey || e.ctrlKey);
      else if (q) allerVersCatalogue(q);
    }
  }

  // La sélection clavier fait défiler SA colonne, jamais la page.
  useEffect(() => {
    if (indexActif < 0) return;
    const el = document.getElementById(`recherche-option-${indexActif}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [indexActif]);

  // Le survol redevient prioritaire au premier mouvement de souris.
  useEffect(() => {
    if (!clavierActif) return;
    const rendreLaMain = () => setClavierActif(false);
    window.addEventListener("mousemove", rendreLaMain, { once: true });
    return () => window.removeEventListener("mousemove", rendreLaMain);
  }, [clavierActif]);

  // Raccourcis globaux : ⌘K / Ctrl+K partout, « / » hors champ de saisie.
  // (Ouverture gérée par le contexte ; ici on ne traite que la fermeture au
  // clavier quand le focus a quitté le champ.)
  useEffect(() => {
    if (!ouvert) return;
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        fermer();
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert, fermer]);

  // ── Glissement vers le bas (mobile) ───────────────────────────────
  // Le suivi vit dans une ref, pas dans un état : `pointerdown` et le premier
  // `pointermove` peuvent arriver dans le même tick, avant que React n'ait
  // re-rendu. Un drapeau en useState serait encore à `false` dans le
  // gestionnaire, et le geste ne démarrerait jamais.
  const geste = useRef({
    actif: false,
    depart: 0,
    dernier: 0,
    temps: 0,
    vitesse: 0,
    deplacement: 0,
  });

  function debutGeste(e: EvenementPointeur<HTMLDivElement>) {
    if (format !== "mobile") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointeur déjà relâché : la capture n'est qu'un confort, le geste
      // fonctionne sans elle tant que le doigt reste sur la poignée.
    }
    geste.current = {
      actif: true,
      depart: e.clientY,
      dernier: e.clientY,
      temps: e.timeStamp,
      vitesse: 0,
      deplacement: 0,
    };
    setGlisse(true);
  }

  function pendantGeste(e: EvenementPointeur<HTMLDivElement>) {
    if (!geste.current.actif) return;
    const dy = e.clientY - geste.current.depart;
    const dt = e.timeStamp - geste.current.temps;
    if (dt > 0) {
      geste.current.vitesse = (e.clientY - geste.current.dernier) / dt;
      geste.current.dernier = e.clientY;
      geste.current.temps = e.timeStamp;
    }
    // Vers le bas : suit le doigt au pixel. Vers le haut : fortement freiné —
    // le panneau est déjà à sa place, rien ne justifie de le tirer plus haut.
    // (Le document dit « avec résistance » sans chiffrer : 0,25 est notre choix.)
    geste.current.deplacement = dy > 0 ? dy : dy * 0.25;
    setGlissement(geste.current.deplacement);
  }

  function finGeste() {
    if (!geste.current.actif) return;
    geste.current.actif = false;
    setGlisse(false);
    const { vitesse, deplacement } = geste.current;
    if (deplacement > 90 || vitesse > 0.5) fermer();
    else setGlissement(0);
  }

  // ── Styles calculés ───────────────────────────────────────────────
  const estMobile = format === "mobile";
  const dureeOuverture = estMobile ? 380 : 220;
  const dureeFermeture = estMobile ? 280 : 160;
  const duree = ouvert ? dureeOuverture : dureeFermeture;
  const dureeOpacite = ouvert ? (estMobile ? 260 : 160) : dureeFermeture;
  const dureeFond = estMobile ? 340 : 200;

  // L'origine est calée sur le bouton déclencheur : en haut à droite en
  // français, en haut à gauche en arabe (la barre mobile est en miroir).
  const origine = estMobile
    ? locale === "ar"
      ? "12% -12px"
      : "88% -12px"
    : "50% -8px";

  function transformPanneau(): string {
    if (mouvementReduit) return "none";
    if (ouvert) {
      // Pendant le geste, le panneau suit le doigt depuis sa position ouverte.
      return glissement ? `translateY(${glissement}px)` : "none";
    }
    return estMobile
      ? "scale(.92) translateY(-18px)"
      : "scale(.98) translateY(-8px)";
  }

  const stylePanneau: CSSProperties = estMobile
    ? {
        top: "calc(56px + env(safe-area-inset-top))",
        insetInlineStart: 12,
        insetInlineEnd: 12,
        borderRadius: 28,
        boxShadow: "0 18px 50px rgba(17,17,17,0.22)",
        maxHeight: hauteurMax ?? 382,
      }
    : {
        top: 76,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        marginInline: "auto",
        width:
          format === "desktop"
            ? "min(880px, calc(100vw - 96px))"
            : "min(700px, calc(100vw - 80px))",
        borderRadius: 24,
        boxShadow: "0 24px 64px rgba(17,17,17,0.20)",
        maxHeight: aucunResultat ? undefined : (hauteurMax ?? 620),
      };

  const deuxColonnes = format === "desktop" && !aucunResultat;

  // ── Rendu ─────────────────────────────────────────────────────────
  return (
    <div
      ref={refRacine}
      // `inert` retire tout le sous-arbre du parcours de tabulation et des
      // lecteurs d'écran tant que l'overlay est fermé.
      inert={!ouvert}
      aria-hidden={!ouvert}
    >
      {/* ═══ Voile ═══════════════════════════════════════════════════
          Le flou est porté par le voile (backdrop-filter) et non par le
          contenu de page : variante prévue par le document, et seule
          compatible avec nos barres de navigation en position fixed. */}
      <button
        type="button"
        onClick={fermer}
        aria-label={t("fermerRecherche")}
        className="voile-recherche fixed inset-0 z-[60] cursor-default motion-reduce:transition-none"
        style={{
          background: `rgba(17,17,17,${estMobile ? 0.18 : 0.12})`,
          ["--flou-recherche" as string]: estMobile ? "8px" : "5px",
          opacity: ouvert ? 1 : 0,
          pointerEvents: ouvert ? "auto" : "none",
          transition: `opacity ${dureeFond}ms ${COURBE_FOND}`,
        }}
      />

      {/* ═══ Panneau ═════════════════════════════════════════════════ */}
      <div
        ref={refPanneau}
        role="dialog"
        aria-modal="true"
        aria-label={t("dialogue")}
        className="fixed z-[61] flex flex-col overflow-hidden bg-white motion-reduce:transition-none"
        style={{
          ...stylePanneau,
          transformOrigin: origine,
          transform: transformPanneau(),
          opacity: ouvert ? 1 : 0,
          pointerEvents: ouvert ? "auto" : "none",
          transition: glisse
            ? "none"
            : `transform ${duree}ms ${COURBE_PANNEAU}, opacity ${dureeOpacite}ms ease`,
        }}
      >
        {/* Poignée de drag — mobile uniquement. Toute la zone de 22 px est
            la cible : du geste de fermeture comme du simple tap. */}
        {estMobile && (
          <div
            onPointerDown={debutGeste}
            onPointerMove={pendantGeste}
            onPointerUp={finGeste}
            onPointerCancel={finGeste}
            // Le tap ferme, mais pas le clic de fin de glissement : sans ce
            // garde-fou, un geste trop court fermerait quand même le panneau
            // juste après l'avoir vu revenir en place.
            onClick={() => {
              if (Math.abs(geste.current.deplacement) < 4) fermer();
            }}
            className="grid h-[22px] flex-none cursor-grab touch-none place-items-center"
          >
            <div className="h-[4px] w-[36px] rounded-[2px] bg-[rgba(0,0,0,0.14)]" />
          </div>
        )}

        {/* ── Rangée du champ ─────────────────────────────────────── */}
        <div
          className="flex flex-none items-center"
          style={
            estMobile
              ? { padding: "0 12px 12px", gap: 8 }
              : { padding: "16px 16px 14px", gap: 8 }
          }
        >
          <div
            className="flex min-w-0 flex-1 items-center bg-[#F4F3F0]"
            style={
              estMobile
                ? { height: 48, borderRadius: 24, padding: "0 14px", gap: 10 }
                : { height: 56, borderRadius: 28, padding: "0 18px", gap: 12 }
            }
          >
            <Loupe
              className={`flex-none text-[#111111] ${
                estMobile ? "h-[21px] w-[21px]" : "h-[22px] w-[22px]"
              }`}
              trait={1.9}
              couleur="#111"
            />
            <input
              ref={refChamp}
              type="search"
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              onKeyDown={surToucheChamp}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              role="combobox"
              aria-expanded={enSaisie}
              aria-controls="recherche-suggestions recherche-resultats"
              aria-activedescendant={
                indexActif >= 0 ? `recherche-option-${indexActif}` : undefined
              }
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[#111111] placeholder:text-[rgba(0,0,0,0.40)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              style={{
                fontSize: estMobile ? 16 : 17,
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            />

            {/* Pastille d'effacement — cible de 30 × 44, plus haute que le
                champ (marges négatives) pour rester confortable au pouce. */}
            <button
              type="button"
              onClick={() => {
                setRequete("");
                refChamp.current?.focus();
              }}
              aria-label={t("effacer")}
              className="grid flex-none place-items-center transition-opacity duration-[160ms] ease-linear"
              style={{
                width: 30,
                height: 44,
                margin: "-2px 0",
                opacity: requete ? 1 : 0,
                pointerEvents: requete ? "auto" : "none",
              }}
            >
              <span
                className="grid place-items-center rounded-full bg-[rgba(0,0,0,0.16)]"
                style={{ width: estMobile ? 20 : 22, height: estMobile ? 20 : 22 }}
              >
                <Croix className="h-[12px] w-[12px]" trait={2.6} couleur="#fff" />
              </span>
            </button>

            {/* Badge Échap — desktop et tablette. */}
            {!estMobile && (
              <span
                className="flex-none rounded-[6px] bg-[#F4F3F0] font-mono text-[rgba(0,0,0,0.45)]"
                style={{
                  height: 22,
                  padding: "0 6px",
                  fontSize: 11,
                  lineHeight: "22px",
                }}
                aria-hidden="true"
              >
                Esc
              </span>
            )}
          </div>

          {estMobile ? (
            <button
              type="button"
              onClick={fermer}
              className="grid h-[44px] flex-none place-items-center px-[6px] text-[15px] font-medium text-[#111111] transition-opacity duration-[120ms] active:opacity-45"
            >
              {t("fermer")}
            </button>
          ) : (
            <button
              type="button"
              onClick={fermer}
              aria-label={t("fermerRecherche")}
              className="grid h-[36px] w-[36px] flex-none place-items-center rounded-[18px] transition hover:bg-[#F4F3F0]"
            >
              <Croix className="h-[14px] w-[14px]" trait={2} couleur="#111" />
            </button>
          )}
        </div>

        {/* ── Barre de chargement ─────────────────────────────────────
            Câblée mais jamais allumée aujourd'hui : la recherche est locale
            (produits déjà en mémoire), donc instantanée, et le retard de
            150 ms du document la garde éteinte. Elle s'allumera le jour où
            la recherche passera côté serveur. */}
        <div
          className="h-[2px] flex-none overflow-hidden transition-opacity duration-200"
          style={{ opacity: 0 }}
          aria-hidden="true"
        >
          <div className="h-[2px] w-[38%] animate-[om-slide_1s_cubic-bezier(.4,0,.6,1)_infinite] rounded-[1px] bg-[#111111]" />
        </div>

        {/* ── Contenu ─────────────────────────────────────────────── */}
        {deuxColonnes ? (
          <div
            className="grid min-h-0 flex-1"
            style={{ gridTemplateColumns: "320px 1fr" }}
          >
            <div
              className="min-h-0 overflow-y-auto border-e border-[rgba(0,0,0,0.07)] p-[20px] [overscroll-behavior:contain]"
              id="recherche-suggestions"
              role={enSaisie ? "listbox" : undefined}
              aria-label={t("suggestions")}
            >
              {enSaisie ? (
                <ColonneSuggestions
                  suggestions={suggestions}
                  requete={q}
                  chips={chipsRayons}
                  libelleCategorie={libelleCategorie}
                  indexActif={indexActif}
                  clavierActif={clavierActif}
                  onActiver={(i) => activer(entrees[i])}
                  onRayon={(c) => setRequete(libelleCategorie(c))}
                  t={t}
                />
              ) : (
                <ColonneParDefaut
                  recentes={recentes}
                  premierUsage={premierUsage}
                  categories={categories}
                  libelleCategorie={libelleCategorie}
                  onUtiliser={setRequete}
                  onSupprimer={(r) => {
                    const suivante = recentes.filter((x) => x !== r);
                    setRecentes(suivante);
                    ecrireRecentes(suivante);
                  }}
                  onToutEffacer={() => {
                    setRecentes([]);
                    ecrireRecentes([]);
                  }}
                  t={t}
                />
              )}
            </div>

            <div
              className="min-h-0 overflow-y-auto p-[24px] [overscroll-behavior:contain]"
              id="recherche-resultats"
              role={enSaisie ? "listbox" : undefined}
              aria-label={t("produits")}
            >
              {enSaisie ? (
                <ColonneResultats
                  resultats={resultatsAffiches}
                  total={resultats.length}
                  decalage={suggestions.length}
                  indexActif={indexActif}
                  clavierActif={clavierActif}
                  locale={locale}
                  onProduit={ouvrirProduit}
                  onTous={() => allerVersCatalogue(q)}
                  t={t}
                />
              ) : (
                <>
                  <TitreSection desktop className="mb-[8px]">
                    {premierUsage ? t("bestSellers") : t("populaires")}
                  </TitreSection>
                  <div className="flex flex-col">
                    {vitrine.map((p) => (
                      <LigneProduit
                        key={p.id}
                        produit={p}
                        locale={locale}
                        desktop
                        onClick={(nouvelOnglet) => ouvrirProduit(p, nouvelOnglet)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className="min-h-0 flex-1 overflow-y-auto pb-[16px] [overscroll-behavior:contain] [-webkit-overflow-scrolling:touch]"
            style={{ scrollbarWidth: "none" }}
          >
            {aucunResultat ? (
              <EtatSansResultat
                requete={requete}
                correction={correction}
                categories={categories}
                libelleCategorie={libelleCategorie}
                onCorrection={(c) => setRequete(c)}
                onRayon={(c) => setRequete(libelleCategorie(c))}
                compact={estMobile}
                t={t}
              />
            ) : enSaisie ? (
              <EtatResultats
                suggestions={suggestions}
                requete={q}
                resultats={resultatsAffiches}
                chips={chipsRayons}
                libelleCategorie={libelleCategorie}
                locale={locale}
                onSuggestion={(s) => {
                  setRequete(s);
                  refChamp.current?.focus();
                }}
                onProduit={ouvrirProduit}
                onRayon={(c) => setRequete(libelleCategorie(c))}
                t={t}
              />
            ) : (
              <EtatVide
                recentes={recentes}
                premierUsage={premierUsage}
                categories={categories}
                libelleCategorie={libelleCategorie}
                vitrine={vitrine}
                locale={locale}
                onUtiliser={setRequete}
                onSupprimer={(r) => {
                  const suivante = recentes.filter((x) => x !== r);
                  setRecentes(suivante);
                  ecrireRecentes(suivante);
                }}
                onToutEffacer={() => {
                  setRecentes([]);
                  ecrireRecentes([]);
                }}
                onRayon={(c) => setRequete(libelleCategorie(c))}
                onProduit={ouvrirProduit}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Briques partagées
// ════════════════════════════════════════════════════════════════════

type Traduire = ReturnType<typeof useTranslations>;

/** Titre de section — 12,5 px en mobile, 12 px en desktop. */
function TitreSection({
  children,
  desktop = false,
  className = "",
}: {
  children: React.ReactNode;
  desktop?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`font-semibold text-[rgba(0,0,0,0.50)] ${className}`}
      style={{
        fontSize: desktop ? 12 : 12.5,
        lineHeight: 1,
        letterSpacing: desktop ? "0.02em" : "0.01em",
      }}
    >
      {children}
    </div>
  );
}

/** Vignette carrée : photo réelle si on en a une, rayures sinon. */
function Image({
  produit,
  taille,
  rayon,
  locale,
}: {
  produit: Produit;
  taille: number;
  rayon: number;
  locale: Locale;
}) {
  const source = produit.images[0];
  const estUrl = !!source && /^https?:\/\//.test(source);
  const style: CSSProperties = {
    width: taille,
    height: taille,
    borderRadius: rayon,
    background: RAYURES,
  };
  if (!estUrl) return <div className="flex-none" style={style} aria-hidden="true" />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={source}
      alt={produit.nom[locale]}
      className="flex-none object-cover"
      style={style}
    />
  );
}

/** Chip de rayon — fond blanc, bordure interne. */
function ChipRayon({
  libelle,
  onClick,
  qualificatif,
}: {
  libelle: string;
  onClick?: () => void;
  qualificatif?: string;
}) {
  const contenu = (
    <>
      <span
        className="whitespace-nowrap text-[#111111]"
        style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1 }}
      >
        {libelle}
      </span>
      {qualificatif && (
        <span
          className="font-mono text-[rgba(0,0,0,0.40)]"
          style={{ fontSize: 12, lineHeight: 1 }}
        >
          {qualificatif}
        </span>
      )}
    </>
  );
  const classes =
    "flex h-[44px] flex-none items-center gap-[8px] rounded-[22px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset]";
  if (!onClick) {
    return (
      <div className={classes} style={{ padding: "0 16px" }}>
        {contenu}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${classes} transition-colors active:bg-[#F4F3F0]`}
      style={{ padding: qualificatif ? "0 16px" : "0 18px" }}
    >
      {contenu}
    </button>
  );
}

/** Recherche récente — chip supprimable (mobile / tablette). */
function ChipRecente({
  libelle,
  onUtiliser,
  onSupprimer,
  t,
}: {
  libelle: string;
  onUtiliser: () => void;
  onSupprimer: () => void;
  t: Traduire;
}) {
  return (
    <div className="flex h-[44px] items-center gap-[8px] rounded-[22px] bg-[#F4F3F0] ps-[15px] pe-[6px]">
      <button
        type="button"
        onClick={onUtiliser}
        className="text-[#111111]"
        style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1 }}
      >
        {libelle}
      </button>
      <button
        type="button"
        onClick={onSupprimer}
        aria-label={`${t("supprimer")} : ${libelle}`}
        className="grid h-[44px] w-[30px] place-items-center"
      >
        <Croix className="h-[12px] w-[12px]" trait={2.4} couleur="rgba(0,0,0,0.40)" />
      </button>
    </div>
  );
}

/**
 * Ligne de résultat produit — variante B, « nom respiré ».
 *
 * Le nom occupe toute la largeur sur deux lignes, le prix se pose juste en
 * dessous. Ce choix vient des noms réels du catalogue : « Ruban Adhésif
 * Antidérapant Réutilisable 12 pièces » se faisait couper avant le mot qui
 * distingue le produit dès qu'une colonne de prix lui mangeait la droite.
 *
 * Contrepartie assumée : les prix ne forment plus une colonne alignée. Dans
 * une recherche on cherche un objet, on ne compare pas des tarifs.
 *
 * Hauteur : 76 px quand le nom passe à la ligne, 72 px sinon (l'image de
 * 56 px et ses marges posent alors le plancher). Le padding vertical est à
 * 8 px et non 10 : à 10, la ligne à deux lignes montait à 80 px et faisait
 * tomber le nombre de produits visibles au-dessus du clavier de 3 à 2.
 * Le rayon n'est plus affiché ici — il vit dans les chips de la section
 * « Catégories », juste en dessous des résultats.
 */
function LigneProduit({
  produit,
  locale,
  onClick,
  id,
  actif,
  survolInhibe,
  desktop = false,
}: {
  produit: Produit;
  locale: Locale;
  onClick: (nouvelOnglet: boolean) => void;
  id?: string;
  actif?: boolean;
  survolInhibe?: boolean;
  desktop?: boolean;
}) {
  return (
    <button
      type="button"
      id={id}
      role={id ? "option" : undefined}
      aria-selected={id ? !!actif : undefined}
      onClick={(e) => onClick(e.metaKey || e.ctrlKey)}
      className={`relative flex w-full items-center gap-[12px] text-start ${
        survolInhibe ? "" : "hover:bg-[#F7F6F3]"
      } ${actif ? "bg-[#F4F3F0]" : ""} ${desktop ? "rounded-[10px]" : ""}`}
      style={{ padding: desktop ? "8px 12px" : "8px 20px" }}
    >
      {/* Sélection clavier : barre de 2 px à l'intérieur du rayon. */}
      {actif && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-[2px] bg-[#111111]"
        />
      )}
      <Image
        produit={produit}
        taille={desktop ? 48 : 56}
        rayon={desktop ? 12 : 14}
        locale={locale}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span
          // line-clamp plutôt que truncate : deux lignes, puis les points de
          // suspension. C'est tout l'objet de la variante.
          className="line-clamp-2 text-[#111111]"
          style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1.3 }}
        >
          {produit.nom[locale]}
        </span>
        <span
          className="text-[#111111]"
          style={{
            fontSize: desktop ? 14.5 : 15,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {formatPrix(produit.prix, locale)}
        </span>
      </span>
    </button>
  );
}

/** Suggestion de complétion — la partie saisie ressort en gras. */
function LigneSuggestion({
  texte,
  requete,
  onClick,
  id,
  actif,
  survolInhibe,
  desktop = false,
}: {
  texte: string;
  requete: string;
  onClick: () => void;
  id?: string;
  actif?: boolean;
  survolInhibe?: boolean;
  desktop?: boolean;
}) {
  const { avant, correspondance, apres } = decouper(texte, requete);
  return (
    <button
      type="button"
      id={id}
      role={id ? "option" : undefined}
      aria-selected={id ? !!actif : undefined}
      onClick={onClick}
      className={`relative flex w-full items-center gap-[12px] text-start ${
        survolInhibe ? "" : "hover:bg-[#F7F6F3]"
      } ${actif ? "bg-[#F4F3F0]" : ""} ${desktop ? "rounded-[10px]" : ""}`}
      style={{
        height: desktop ? 40 : 46,
        padding: desktop ? "0 12px" : "0 20px",
      }}
    >
      {actif && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-[2px] bg-[#111111]"
        />
      )}
      <Loupe
        className="h-[18px] w-[18px] flex-none"
        trait={2}
        couleur="rgba(0,0,0,0.45)"
      />
      <span
        className="truncate text-[rgba(0,0,0,0.55)]"
        style={{ fontSize: desktop ? 14 : 15, fontWeight: 400, lineHeight: 1.2 }}
      >
        {avant}
        <span className="font-semibold text-[#111111]">{correspondance}</span>
        {apres}
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// États — mobile et tablette
// ════════════════════════════════════════════════════════════════════

function EtatVide({
  recentes,
  premierUsage,
  categories,
  libelleCategorie,
  vitrine,
  locale,
  onUtiliser,
  onSupprimer,
  onToutEffacer,
  onRayon,
  onProduit,
  t,
}: {
  recentes: string[];
  premierUsage: boolean;
  categories: { id: string; nomFr: string; nomAr: string }[];
  libelleCategorie: (c: { nomFr: string; nomAr: string }) => string;
  vitrine: Produit[];
  locale: Locale;
  onUtiliser: (r: string) => void;
  onSupprimer: (r: string) => void;
  onToutEffacer: () => void;
  onRayon: (c: { nomFr: string; nomAr: string }) => void;
  onProduit: (p: Produit) => void;
  t: Traduire;
}) {
  return (
    <>
      {!premierUsage && (
        <div
          className="flex flex-col gap-[8px]"
          style={{ padding: "6px 20px 0" }}
        >
          <div className="flex items-center justify-between">
            <TitreSection>{t("recentes")}</TitreSection>
            <button
              type="button"
              onClick={onToutEffacer}
              className="grid h-[32px] place-items-center font-medium text-[rgba(0,0,0,0.50)] transition-opacity active:opacity-45"
              style={{ fontSize: 12.5, lineHeight: 1 }}
            >
              {t("toutEffacer")}
            </button>
          </div>
          <div className="flex flex-wrap gap-[8px]">
            {recentes.slice(0, 3).map((r) => (
              <ChipRecente
                key={r}
                libelle={r}
                onUtiliser={() => onUtiliser(r)}
                onSupprimer={() => onSupprimer(r)}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[20px]" style={{ paddingTop: 18 }}>
        <div className="flex flex-col gap-[10px]">
          <TitreSection className="px-[20px]">{t("categories")}</TitreSection>
          <div
            className="flex gap-[8px] overflow-x-auto"
            style={{ padding: "0 20px 2px", scrollbarWidth: "none" }}
          >
            {categories.map((c) => (
              <ChipRayon
                key={c.id}
                libelle={libelleCategorie(c)}
                onClick={() => onRayon(c)}
              />
            ))}
          </div>
        </div>

        {/* Vitrine en lignes, comme les résultats : c'est le même objet, il
            n'y a aucune raison qu'il change de forme selon l'état. Le
            défilement horizontal de vignettes a disparu avec la variante B —
            il ramenait la mise en page de la grille du catalogue dans un
            endroit où l'on cherche au lieu de parcourir. */}
        <div className="flex flex-col gap-[6px]">
          <TitreSection className="px-[20px]">
            {premierUsage ? t("bestSellers") : t("populaires")}
          </TitreSection>
          <div className="flex flex-col">
            {vitrine.map((p) => (
              <LigneProduit
                key={p.id}
                produit={p}
                locale={locale}
                onClick={() => onProduit(p)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function EtatResultats({
  suggestions,
  requete,
  resultats,
  chips,
  libelleCategorie,
  locale,
  onSuggestion,
  onProduit,
  onRayon,
  t,
}: {
  suggestions: string[];
  requete: string;
  resultats: Produit[];
  chips: { id: string; nomFr: string; nomAr: string }[];
  libelleCategorie: (c: { nomFr: string; nomAr: string }) => string;
  locale: Locale;
  onSuggestion: (s: string) => void;
  onProduit: (p: Produit, nouvelOnglet: boolean) => void;
  onRayon: (c: { nomFr: string; nomAr: string }) => void;
  t: Traduire;
}) {
  return (
    <div className="flex flex-col gap-[18px]" style={{ paddingTop: 6 }}>
      {suggestions.length > 0 && (
        <div className="flex flex-col">
          {suggestions.map((s) => (
            <LigneSuggestion
              key={s}
              texte={s}
              requete={requete}
              onClick={() => onSuggestion(s)}
            />
          ))}
        </div>
      )}

      {resultats.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          <TitreSection className="px-[20px]">{t("produits")}</TitreSection>
          <div className="flex flex-col">
            {resultats.map((p) => (
              <LigneProduit
                key={p.id}
                produit={p}
                locale={locale}
                onClick={(nouvelOnglet) => onProduit(p, nouvelOnglet)}
              />
            ))}
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          <TitreSection className="px-[20px]">{t("rayons")}</TitreSection>
          <div
            className="flex gap-[8px] overflow-x-auto"
            style={{ padding: "0 20px 4px", scrollbarWidth: "none" }}
          >
            {chips.map((c) => (
              <ChipRayon
                key={c.id}
                libelle={libelleCategorie(c)}
                qualificatif={t("qualificatifRayon")}
                onClick={() => onRayon(c)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EtatSansResultat({
  requete,
  correction,
  categories,
  libelleCategorie,
  onCorrection,
  onRayon,
  compact,
  t,
}: {
  requete: string;
  correction: string | null;
  categories: { id: string; nomFr: string; nomAr: string }[];
  libelleCategorie: (c: { nomFr: string; nomAr: string }) => string;
  onCorrection: (c: string) => void;
  onRayon: (c: { nomFr: string; nomAr: string }) => void;
  compact: boolean;
  t: Traduire;
}) {
  return (
    <div
      className="flex flex-col gap-[22px]"
      style={{ padding: compact ? "22px 20px 0" : "22px 24px 24px" }}
    >
      <div className="flex flex-col gap-[6px]">
        <div
          className="text-[#111111] [text-wrap:pretty]"
          style={{
            fontSize: compact ? 16 : 18,
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {t("aucunResultat", { requete })}
        </div>
        <div
          className="text-[rgba(0,0,0,0.50)] [text-wrap:pretty]"
          style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.45 }}
        >
          {t("aucunResultatAide")}
        </div>
      </div>

      {correction && (
        <button
          type="button"
          onClick={() => onCorrection(correction)}
          className="flex h-[44px] items-center gap-[8px] text-[rgba(0,0,0,0.55)] transition-opacity active:opacity-50"
          style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1 }}
        >
          {t("essayer")}{" "}
          <span className="font-semibold text-[#111111] underline [text-underline-offset:3px]">
            {correction}
          </span>
        </button>
      )}

      <div className="flex flex-col gap-[10px]">
        <TitreSection>{t("categoriesPopulaires")}</TitreSection>
        <div className="flex flex-wrap gap-[8px]">
          {categories.map((c) => (
            <ChipRayon
              key={c.id}
              libelle={libelleCategorie(c)}
              onClick={() => onRayon(c)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Colonnes — desktop
// ════════════════════════════════════════════════════════════════════

function LigneListe({
  libelle,
  onClick,
  onSupprimer,
  labelSupprimer,
}: {
  libelle: string;
  onClick: () => void;
  onSupprimer?: () => void;
  labelSupprimer?: string;
}) {
  return (
    <div className="group relative flex items-center rounded-[10px] hover:bg-[#F7F6F3]">
      <button
        type="button"
        onClick={onClick}
        className="flex h-[40px] min-w-0 flex-1 items-center px-[12px] text-start text-[#111111]"
        style={{ fontSize: 14, fontWeight: 400 }}
      >
        <span className="truncate">{libelle}</span>
      </button>
      {onSupprimer && (
        <button
          type="button"
          onClick={onSupprimer}
          aria-label={labelSupprimer}
          // Révélée au survol seulement — à la souris, une croix sur chaque
          // ligne transformerait la liste en champ de mines.
          className="me-[8px] grid h-[24px] w-[24px] flex-none place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Croix className="h-[11px] w-[11px]" trait={2.4} couleur="rgba(0,0,0,0.40)" />
        </button>
      )}
    </div>
  );
}

function ColonneParDefaut({
  recentes,
  premierUsage,
  categories,
  libelleCategorie,
  onUtiliser,
  onSupprimer,
  onToutEffacer,
  t,
}: {
  recentes: string[];
  premierUsage: boolean;
  categories: { id: string; nomFr: string; nomAr: string }[];
  libelleCategorie: (c: { nomFr: string; nomAr: string }) => string;
  onUtiliser: (r: string) => void;
  onSupprimer: (r: string) => void;
  onToutEffacer: () => void;
  t: Traduire;
}) {
  return (
    <>
      {!premierUsage && (
        <>
          <div className="mb-[8px] flex items-center justify-between">
            <TitreSection desktop>{t("recentes")}</TitreSection>
            <button
              type="button"
              onClick={onToutEffacer}
              className="font-medium text-[rgba(0,0,0,0.50)] transition hover:text-[#111111]"
              style={{ fontSize: 12, lineHeight: 1 }}
            >
              {t("toutEffacer")}
            </button>
          </div>
          <div className="flex flex-col">
            {recentes.map((r) => (
              <LigneListe
                key={r}
                libelle={r}
                onClick={() => onUtiliser(r)}
                onSupprimer={() => onSupprimer(r)}
                labelSupprimer={`${t("supprimer")} : ${r}`}
              />
            ))}
          </div>
        </>
      )}

      <TitreSection desktop className={premierUsage ? "mb-[8px]" : "mb-[8px] mt-[20px]"}>
        {t("categories")}
      </TitreSection>
      <div className="flex flex-col">
        {categories.map((c) => (
          <LigneListe
            key={c.id}
            libelle={libelleCategorie(c)}
            onClick={() => onUtiliser(libelleCategorie(c))}
          />
        ))}
      </div>
    </>
  );
}

function ColonneSuggestions({
  suggestions,
  requete,
  chips,
  libelleCategorie,
  indexActif,
  clavierActif,
  onActiver,
  onRayon,
  t,
}: {
  suggestions: string[];
  requete: string;
  chips: { id: string; nomFr: string; nomAr: string }[];
  libelleCategorie: (c: { nomFr: string; nomAr: string }) => string;
  indexActif: number;
  clavierActif: boolean;
  onActiver: (index: number) => void;
  onRayon: (c: { nomFr: string; nomAr: string }) => void;
  t: Traduire;
}) {
  return (
    <>
      {suggestions.length > 0 && (
        <>
          <TitreSection desktop className="mb-[8px]">
            {t("suggestions")}
          </TitreSection>
          <div className="flex flex-col">
            {suggestions.map((s, i) => (
              <LigneSuggestion
                key={s}
                texte={s}
                requete={requete}
                desktop
                id={`recherche-option-${i}`}
                actif={indexActif === i}
                survolInhibe={clavierActif}
                onClick={() => onActiver(i)}
              />
            ))}
          </div>
        </>
      )}

      {chips.length > 0 && (
        <>
          <TitreSection
            desktop
            className={suggestions.length > 0 ? "mb-[8px] mt-[20px]" : "mb-[8px]"}
          >
            {t("rayons")}
          </TitreSection>
          <div className="flex flex-wrap gap-[8px]">
            {chips.map((c) => (
              <ChipRayon
                key={c.id}
                libelle={libelleCategorie(c)}
                qualificatif={t("qualificatifRayon")}
                onClick={() => onRayon(c)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ColonneResultats({
  resultats,
  total,
  decalage,
  indexActif,
  clavierActif,
  locale,
  onProduit,
  onTous,
  t,
}: {
  resultats: Produit[];
  total: number;
  decalage: number;
  indexActif: number;
  clavierActif: boolean;
  locale: Locale;
  onProduit: (p: Produit, nouvelOnglet: boolean) => void;
  onTous: () => void;
  t: Traduire;
}) {
  const indexTous = decalage + resultats.length;
  return (
    <>
      <TitreSection desktop className="mb-[8px]">
        {t("produits")}
      </TitreSection>
      <div className="flex flex-col">
        {resultats.map((p, i) => (
          <LigneProduit
            key={p.id}
            produit={p}
            locale={locale}
            desktop
            id={`recherche-option-${decalage + i}`}
            actif={indexActif === decalage + i}
            survolInhibe={clavierActif}
            onClick={(nouvelOnglet) => onProduit(p, nouvelOnglet)}
          />
        ))}
      </div>
      {total > resultats.length && (
        <button
          type="button"
          id={`recherche-option-${indexTous}`}
          role="option"
          aria-selected={indexActif === indexTous}
          onClick={onTous}
          className={`mt-[4px] flex h-[40px] w-full items-center rounded-[10px] px-[12px] text-start font-medium text-[#111111] ${
            clavierActif ? "" : "hover:bg-[#F7F6F3]"
          } ${indexActif === indexTous ? "bg-[#F4F3F0]" : ""}`}
          style={{ fontSize: 14 }}
        >
          {t("voirTousResultats", { n: total })}
        </button>
      )}
    </>
  );
}
