"use client";

import { Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Sélecteur de quantité — version moderne :
 *  - Icônes lucide (SVG), parfaitement centrées (plus de soucis de line-height).
 *  - Stepper compact, fond clair, état "disabled" visible quand on est au min.
 *
 * Composant CONTRÔLÉ : value + onChange viennent du parent.
 */
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const t = useTranslations("produit");

  function set(nouvelle: number) {
    if (nouvelle < min) nouvelle = min;
    if (nouvelle > max) nouvelle = max;
    onChange(nouvelle);
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label={t("quantite")}
    >
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label={t("diminuer")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* La valeur — pas d'input pour rester compact et propre. */}
      <span
        className="min-w-10 text-center text-sm font-semibold tabular-nums text-gray-900"
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label={t("augmenter")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
