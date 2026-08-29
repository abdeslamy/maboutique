import FormulaireProduit from "@/components/admin/FormulaireProduit";
import { getCategories } from "@/lib/categories";

export default async function AdminProduitNouveauPage() {
  const categories = await getCategories();
  return <FormulaireProduit mode="creer" categories={categories} />;
}
