import { notFound } from "next/navigation";
import { getCommandeParId } from "@/lib/orders";
import DetailCommandeAdmin from "@/components/admin/DetailCommandeAdmin";

export default async function AdminCommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commande = await getCommandeParId(id);
  if (!commande) notFound();

  return <DetailCommandeAdmin commande={commande} />;
}
