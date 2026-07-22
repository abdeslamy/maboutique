import { notFound } from "next/navigation";
import { getProduitParId } from "@/lib/products";
import FormulaireProduit from "@/components/admin/FormulaireProduit";

export default async function AdminProduitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produit = await getProduitParId(id);
  if (!produit) {
    notFound();
  }
  return <FormulaireProduit mode="modifier" produit={produit} />;
}
