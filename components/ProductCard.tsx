"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Produit } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { formatPrix } from "@/lib/format";

/**
 * Carte d'un produit — TOUTE la carte est désormais un lien.
 *
 * Règle HTML : pas de <a> dans <a>. Donc on remplace l'ancien "bouton Voir le
 * détail" (qui était un <Link>) par un simple <span> stylé en bouton.
 *
 * Pour les futurs boutons d'action sur la carte (ex. "Ajouter au panier"),
 * on devra utiliser e.preventDefault() + e.stopPropagation() pour éviter que
 * le clic ne navigue aussi vers le détail.
 *
 * Feedback visuel au survol : ombre + très léger zoom de l'image → l'utilisateur
 * sent que la carte est interactive.
 */
export default function ProductCard({ produit }: { produit: Produit }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("produit");
  const nom = produit.nom[locale];
  // Première "image" du tableau pour la vignette (multi-images : voir amélioration 3).
  const imageVignette = produit.images[0];

  return (
    <Link
      href={`/produits/${produit.id}`}
      // "group" permet aux enfants d'utiliser group-hover:* pour réagir au survol de la carte.
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      aria-label={nom}
    >
      {/* Image / placeholder : un léger zoom au survol pour faire "vivant". */}
      <div
        className={`flex h-44 items-center justify-center overflow-hidden text-6xl transition ${imageVignette}`}
        aria-hidden="true"
      >
        <span className="transition duration-300 group-hover:scale-110">
          {produit.emoji}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-medium text-gray-900">
          {nom}
        </h3>
        <p className="mt-auto text-lg font-semibold text-black">
          {formatPrix(produit.prix, locale)}
        </p>

        {/* Plus un <Link> — juste un <span> stylé en bouton, pour ne PAS imbriquer deux <a>. */}
        <span className="rounded-full bg-black px-4 py-2 text-center text-sm font-medium text-white transition group-hover:bg-gray-800">
          {t("voirDetail")}
        </span>
      </div>
    </Link>
  );
}
