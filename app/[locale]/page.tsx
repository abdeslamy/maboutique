import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/ProductCard";
import BarreRechercheHome from "@/components/BarreRechercheHome";
import { getProduitsResume } from "@/lib/products";

export default async function Accueil() {
  const t = await getTranslations("accueil");

  // Coups de cœur = les 4 produits les plus récemment ajoutés en base
  // (getAllProduits trie déjà par createdAt desc).
  const vedettes = (await getProduitsResume()).slice(0, 4);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:py-24">
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("titre")}
          </h1>
          <p className="max-w-xl text-lg text-gray-600">{t("sousTitre")}</p>
        </div>

        {/* Barre de recherche moderne (mobile + desktop) */}
        <BarreRechercheHome />

        <Link
          href="/produits"
          className="text-sm text-gray-600 underline-offset-2 hover:text-black hover:underline"
        >
          {t("voirProduits")} →
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
