"use client";

import { useTranslations } from "next-intl";
import type { StatutCommande } from "@/lib/types";

/**
 * Petite pastille colorée pour afficher un statut de commande.
 * Utilisée dans la liste ET la page détail admin.
 */

const COULEURS: Record<StatutCommande, string> = {
  en_attente: "bg-amber-100 text-amber-800 border-amber-200",
  confirmee: "bg-sky-100 text-sky-800 border-sky-200",
  en_livraison: "bg-violet-100 text-violet-800 border-violet-200",
  livree: "bg-green-100 text-green-800 border-green-200",
  annulee: "bg-red-100 text-red-800 border-red-200",
};

export default function PastilleStatut({
  statut,
  taille = "sm",
}: {
  statut: StatutCommande;
  taille?: "sm" | "md";
}) {
  const t = useTranslations("admin.commandes.statuts");
  const cls = COULEURS[statut];
  const dims =
    taille === "md"
      ? "px-3 py-1 text-sm"
      : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${cls} ${dims}`}
    >
      {t(statut)}
    </span>
  );
}
