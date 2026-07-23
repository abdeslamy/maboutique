import { Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { StatistiquesAdmin } from "@/lib/orders";

/**
 * Top 5 produits (par quantité vendue) — composant serveur.
 */
export default async function TopProduits({
  produits,
  locale,
}: {
  produits: StatistiquesAdmin["topProduits"];
  locale: Locale;
}) {
  const t = await getTranslations("admin.dashboard");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Trophy className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t("topProduits")}
          </h3>
          <p className="text-xs text-gray-500">{t("topProduitsSousTitre")}</p>
        </div>
      </div>

      {produits.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          {t("aucuneVente")}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {produits.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{p.nom}</p>
                <p className="text-xs text-gray-500">
                  {p.quantite} {t("vendus")}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-gray-900">
                {formatPrix(p.ca, locale)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
