import { notFound } from "next/navigation";
import { getProduitParId } from "@/lib/products";
import FormulaireProduit from "@/components/admin/FormulaireProduit";
import { getCategories } from "@/lib/categories";

export default async function AdminProduitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Produit et rayons sont indépendants : on les lit ensemble.
  const [produit, categories] = await Promise.all([
    getProduitParId(id),
    getCategories(),
  ]);
  if (!produit) {
    notFound();
  }
  return (
    <FormulaireProduit
      mode="modifier"
      produit={produit}
      categories={categories}
    />
  );
}
