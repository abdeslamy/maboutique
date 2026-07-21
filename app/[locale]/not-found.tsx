import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Page 404 personnalisée pour le segment [locale].
// Next.js l'affiche automatiquement quand on appelle notFound() ou que
// l'URL ne correspond à aucune route. Elle se traduit selon la locale active.
export default async function PageNonTrouvee() {
  const t = await getTranslations("notFound");

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <p className="text-7xl font-bold text-gray-200">404</p>
      <h1 className="text-2xl font-semibold">{t("titre")}</h1>
      <p className="text-gray-600">{t("message")}</p>
      <Link
        href="/"
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        {t("retourAccueil")}
      </Link>
    </section>
  );
}
