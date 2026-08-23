import CatalogueClient from "@/components/CatalogueClient";
import { getCategories } from "@/lib/categories";

// Page Catalogue (/produits) : la recherche et le filtre vivent dans
// CatalogueClient. Les rayons, eux, sont lus en base ici puis transmis —
// un composant client ne peut pas interroger Prisma.
export default async function PageProduits() {
  const categories = await getCategories();
  return <CatalogueClient categories={categories} />;
}
