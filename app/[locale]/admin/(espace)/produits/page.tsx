import { getAllProduits } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import ListeProduitsAdmin from "@/components/admin/ListeProduitsAdmin";

/**
 * /admin/produits — liste tous les produits pour l'admin.
 * La garde admin est appliquée automatiquement par le layout parent.
 */
export default async function AdminProduitsPage() {
  const [produits, categories] = await Promise.all([
    getAllProduits(),
    getCategories(),
  ]);
  return (
    <ListeProduitsAdmin produitsInitiaux={produits} categories={categories} />
  );
}
