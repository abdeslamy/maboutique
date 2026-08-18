import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Onglet "Configuration" (/admin/configuration).
 *
 * Placeholder volontaire : la structure existe, le contenu viendra dans une
 * étape dédiée (gestion des catégories, délai et frais de livraison...).
 */
export default async function AdminConfigurationPage() {
  const t = await getTranslations("admin.configuration");

  return (
    <section>
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t("sousTitre")}</p>
      </header>

      {/* État vide */}
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
          <Settings className="h-5 w-5 text-gray-500" aria-hidden="true" />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-900">{t("aVenir")}</p>
        <p className="mt-1 max-w-sm text-sm text-gray-600">
          {t("description")}
        </p>

        {/* Aperçu de ce qui est prévu */}
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {(["categories", "livraison"] as const).map((cle) => (
            <li
              key={cle}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
            >
              {t(`prevu.${cle}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
