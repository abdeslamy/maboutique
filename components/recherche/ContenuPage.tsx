"use client";

import type { ReactNode } from "react";
import { useRecherche } from "@/context/RechercheContext";

/**
 * Enveloppe du contenu de page — porte le recul de 1,5 % pendant que
 * l'overlay de recherche est ouvert (`scale(.985)` du document).
 *
 * Le FLOU, lui, n'est pas appliqué ici mais sur le voile, en
 * `backdrop-filter` : c'est la variante que le document autorise
 * explicitement, et elle évite le piège qu'il signale lui-même — un
 * `filter: blur()` crée un contexte d'empilement, et nos deux barres de
 * navigation mobile, qui sont en `position: fixed`, se retrouveraient
 * repositionnées par rapport à cette enveloppe au lieu du viewport.
 * Elles sont donc hors de cette enveloppe, et floutées par le voile.
 */
export default function ContenuPage({ children }: { children: ReactNode }) {
  const { ouvert } = useRecherche();

  return (
    <div
      className="flex flex-1 flex-col transition-transform duration-[340ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none motion-reduce:transform-none"
      style={{ transform: ouvert ? "scale(.985)" : "scale(1)" }}
    >
      {children}
    </div>
  );
}
