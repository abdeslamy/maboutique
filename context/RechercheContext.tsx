"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import OverlayRecherche from "@/components/recherche/OverlayRecherche";

/**
 * État global de l'overlay de recherche.
 *
 * Le provider REND lui-même l'overlay, après `children`. C'est volontaire :
 * le document exige que le panneau et le voile soient hors du conteneur de
 * page (celui qui reçoit la mise à l'échelle), sans quoi ils seraient
 * transformés avec lui.
 */

type ContexteRecherche = {
  ouvert: boolean;
  ouvrir: () => void;
  fermer: () => void;
};

const Contexte = createContext<ContexteRecherche | null>(null);

export function useRecherche(): ContexteRecherche {
  const ctx = useContext(Contexte);
  if (!ctx) {
    throw new Error(
      "useRecherche() doit être utilisé à l'intérieur de <RechercheProvider>"
    );
  }
  return ctx;
}

export function RechercheProvider({
  categories,
  children,
}: {
  /** Rayons de la boutique, lus en base par le layout serveur. */
  categories: { id: string; nomFr: string; nomAr: string }[];
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const refRacine = useRef<HTMLDivElement | null>(null);
  const refChamp = useRef<HTMLInputElement | null>(null);
  /** Élément qui avait le focus à l'ouverture — on le lui rend à la fermeture. */
  const refRetour = useRef<HTMLElement | null>(null);

  const ouvrir = useCallback(() => {
    // Sur iOS, `focus()` n'ouvre le clavier que s'il part du MÊME geste que
    // le tap. Il doit donc être appelé ici, de façon synchrone — pas dans un
    // effet ni dans un setTimeout après l'animation, où il échouerait en
    // silence. C'est aussi pourquoi l'overlay reste monté en permanence :
    // le champ doit déjà exister dans le DOM à cet instant.
    //
    // `inert` est retiré à la main avant le focus : le re-rendu React qui le
    // retirerait n'a pas encore eu lieu, et un élément inerte refuse le focus.
    // Mémorisé AVANT le focus : quel que soit le point d'entrée — la loupe
    // de la navbar, le cercle mobile, la barre du hero, ⌘K — le focus
    // revient là où il était. Sans ça, refermer l'overlay renvoie le focus
    // au <body> et la navigation au clavier repart du haut de la page.
    const actif = document.activeElement;
    refRetour.current = actif instanceof HTMLElement ? actif : null;

    refRacine.current?.removeAttribute("inert");
    refChamp.current?.focus();
    setOuvert(true);
  }, []);

  const fermer = useCallback(() => {
    refChamp.current?.blur();
    setOuvert(false);
    // `isConnected` : si la fermeture vient d'un clic sur un résultat, le
    // déclencheur a pu quitter le DOM avec la page précédente.
    const retour = refRetour.current;
    refRetour.current = null;
    if (retour?.isConnected) retour.focus({ preventScroll: true });
  }, []);

  // Raccourcis clavier : ⌘K / Ctrl+K de partout, « / » sauf quand le focus
  // est déjà dans un champ de saisie — sinon on ne pourrait plus taper de
  // barre oblique nulle part sur le site.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (ouvert) return;
      const cible = e.target as HTMLElement | null;
      const dansUnChamp =
        !!cible &&
        (cible.tagName === "INPUT" ||
          cible.tagName === "TEXTAREA" ||
          cible.tagName === "SELECT" ||
          cible.isContentEditable);

      const raccourciK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const raccourciSlash = e.key === "/" && !dansUnChamp && !e.metaKey && !e.ctrlKey;

      if (raccourciK || raccourciSlash) {
        e.preventDefault();
        ouvrir();
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert, ouvrir]);

  return (
    <Contexte.Provider value={{ ouvert, ouvrir, fermer }}>
      {children}
      <OverlayRecherche
        ouvert={ouvert}
        fermer={fermer}
        categories={categories}
        refRacine={refRacine}
        refChamp={refChamp}
      />
    </Contexte.Provider>
  );
}
