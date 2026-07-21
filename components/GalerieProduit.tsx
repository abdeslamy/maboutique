"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

/**
 * Galerie d'images d'un produit.
 *
 * - Grande image principale (placeholder coloré + emoji).
 * - Flèches précédent / suivant sur les côtés.
 * - Bande de miniatures cliquables en bas.
 *
 * RTL : les FLÈCHES sont logiques (sens de lecture).
 *   En LTR : prev = ◀ à gauche / next = ▶ à droite
 *   En RTL : prev = ▶ à droite / next = ◀ à gauche
 *   On échange donc les icônes selon la locale.
 *   La position (start/end) est gérée par les classes logiques de Tailwind.
 */
export default function GalerieProduit({
  images,
  emoji,
  altPrefix,
}: {
  images: string[];
  emoji: string;
  altPrefix: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("produit");
  const [index, setIndex] = useState(0);

  // Sélection des icônes en fonction du sens de lecture.
  const IconePrec = locale === "ar" ? ChevronRight : ChevronLeft;
  const IconeSuiv = locale === "ar" ? ChevronLeft : ChevronRight;

  function precedent() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function suivant() {
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ─ Image principale ─────────────────────────────────────────── */}
      <div className="relative">
        <div
          className={`flex aspect-square items-center justify-center rounded-3xl text-9xl transition-colors duration-300 ${images[index]}`}
          aria-label={`${altPrefix} — image ${index + 1} / ${images.length}`}
          role="img"
        >
          <span>{emoji}</span>
        </div>

        {/* Flèche "précédent" — collée au "start" (left en LTR, right en RTL) */}
        <button
          type="button"
          onClick={precedent}
          aria-label={t("imagePrecedente")}
          className="absolute start-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <IconePrec className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Flèche "suivant" — collée au "end" */}
        <button
          type="button"
          onClick={suivant}
          aria-label={t("imageSuivante")}
          className="absolute end-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <IconeSuiv className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Indicateur "1 / 4" en bas */}
        <div className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white rtl:translate-x-1/2">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* ─ Miniatures cliquables ───────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => {
          const actif = i === index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${altPrefix} — image ${i + 1}`}
              aria-current={actif ? "true" : undefined}
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl transition focus:outline-none ${img} ${
                actif
                  ? "ring-2 ring-black ring-offset-2"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
