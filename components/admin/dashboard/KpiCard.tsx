import type { LucideIcon } from "lucide-react";

/**
 * Carte KPI générique du dashboard.
 * - Icône colorée en haut à gauche
 * - Grand nombre (valeur)
 * - Sous-titre optionnel (contexte / période)
 * - Enfant en bas (sparkline optionnel)
 */
export default function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  libelle,
  valeur,
  sousTitre,
  enfants,
}: {
  icon: LucideIcon;
  /** ex "text-green-600" */
  iconColor: string;
  /** ex "bg-green-50" */
  iconBg: string;
  libelle: string;
  valeur: string;
  sousTitre?: string;
  enfants?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {libelle}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {valeur}
          </p>
          {sousTitre && (
            <p className="mt-1 text-xs text-gray-500">{sousTitre}</p>
          )}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </span>
      </div>
      {enfants}
    </div>
  );
}
