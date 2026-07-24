import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/ProductCard";
import { getAllProduits } from "@/lib/products";

export default async function Accueil() {
  const t = await getTranslations("accueil");

  // Coups de cœur = les 4 produits les plus récemment ajoutés en base
  // (getAllProduits trie déjà par createdAt desc).
  const vedettes = (await getAllProduits()).slice(0, 4);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("titre")}
        </h1>
        <p className="max-w-xl text-lg text-gray-600">{t("sousTitre")}</p>

        <Link
          href="/produits"
          className="rounded-full bg-black px-8 py-3 text-white transition hover:bg-gray-800"
        >
          {t("voirProduits")}
        </Link>
      </section>

      {/* ── PRODUITS MIS EN AVANT ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("coupsDeCoeur")}
          </h2>
          <Link
            href="/produits"
            className="text-sm text-gray-600 underline-offset-2 hover:text-black hover:underline"
          >
            {t("toutVoir")} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vedettes.map((p) => (
            <ProductCard key={p.id} produit={p} />
          ))}
        </div>
      </section>
    </>
  );
}
