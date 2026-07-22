import { notFound } from "next/navigation";
import { getCommandeParId, transitionsAutorisees } from "@/lib/orders";
import DetailCommandeAdmin from "@/components/admin/DetailCommandeAdmin";

export default async function AdminCommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const commande = await getCommandeParId(id);
  if (!commande) notFound();

  // On calcule les transitions autorisées côté serveur (source de vérité).
  const transitions = transitionsAutorisees(commande.statut);

  return (
    <DetailCommandeAdmin
      commande={commande}
      transitionsAutorisees={transitions}
    />
  );
}
