import { getTranslations } from "next-intl/server";

// Pied de page sobre, visible sur toutes les pages.
// Affiche le copyright, avec l'année calculée à la volée côté serveur.
export default async function Footer() {
  const t = await getTranslations("footer");
  const tMeta = await getTranslations("meta");
  const annee = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-600 sm:flex-row">
        <p>
          © {annee} {tMeta("titreSite")} — {t("droits")}
        </p>
        <p className="text-xs text-gray-400">{t("mention")}</p>
      </div>
    </footer>
  );
}
