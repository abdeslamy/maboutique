import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProduitParId, getAllProduits } from "@/lib/products";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import BoutonAjouterPanier from "@/components/BoutonAjouterPanier";
import GalerieProduit from "@/components/GalerieProduit";
import BoutonRetour from "@/components/BoutonRetour";

// generateStaticParams est désormais ASYNCHRONE : il interroge la base au moment
// du build pour connaître la liste des slugs à pré-générer.
// (Les nouveaux produits ajoutés APRÈS le build seront rendus à la demande.)
export async function generateStaticParams() {
  const produits = await getAllProduits();
  return produits.map((p) => ({ id: p.id }));
}

export default async function PageProduitDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const localeTypee = locale as Locale;

  // Lecture asynchrone depuis la base.
  const produit = await getProduitParId(id);
  if (!produit) {
    notFound();
  }

  const t = await getTranslations("produit");
  const tCat = await getTranslations("categories");

  const nom = produit.nom[localeTypee];
  const description = produit.description[localeTypee];

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      {/* Bouton retour visible et accessible */}
      <div className="mb-6">
        <BoutonRetour href="/produits" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Galerie multi-images avec flèches + miniatures */}
        <GalerieProduit
          images={produit.images}
          emoji={produit.emoji}
          altPrefix={nom}
        />

        {/* Infos produit */}
        <div className="flex flex-col gap-5">
          <span className="inline-block w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-700">
            {tCat(produit.categorie)}
          </span>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {nom}
          </h1>

          <p className="text-3xl font-semibold text-black">
            {formatPrix(produit.prix, localeTypee)}
          </p>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              {t("description")}
            </h2>
            <p className="leading-relaxed text-gray-700">{description}</p>
          </div>

          <p className="text-sm font-medium text-green-700">{t("enStock")}</p>

          <div className="mt-2">
            <BoutonAjouterPanier produit={produit} />
          </div>
        </div>
      </div>
    </section>
  );
}
