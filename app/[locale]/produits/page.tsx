import CatalogueClient from "@/components/CatalogueClient";
import { getCategories } from "@/lib/categories";
import { getProduitsResume } from "@/lib/products";

// Page Catalogue (/produits) : la recherche et le filtre vivent dans
// CatalogueClient. Les rayons, eux, sont lus en base ici puis transmis —
// un composant client ne peut pas interroger Prisma.
export default async function PageProduits() {
  // Le catalogue charge SES produits ici, au lieu de les recevoir d'un
  // fournisseur global monté sur toutes les pages. C'est la seule page qui a
  // besoin de la liste entière — et c'est ici qu'une pagination viendra se
  // greffer, sans toucher au reste du site.
  const [categories, produits] = await Promise.all([
    getCategories(),
    getProduitsResume(),
  ]);
  return <CatalogueClient categories={categories} produits={produits} />;
}
