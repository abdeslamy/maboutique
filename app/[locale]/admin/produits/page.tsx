import { getAllProduits } from "@/lib/products";
import ListeProduitsAdmin from "@/components/admin/ListeProduitsAdmin";

/**
 * /admin/produits — liste tous les produits pour l'admin.
 * La garde admin est appliquée automatiquement par le layout parent.
 */
export default async function AdminProduitsPage() {
  const produits = await getAllProduits();
  return <ListeProduitsAdmin produitsInitiaux={produits} />;
}
