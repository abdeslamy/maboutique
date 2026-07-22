import { getAllCommandes } from "@/lib/orders";
import ListeCommandesAdmin from "@/components/admin/ListeCommandesAdmin";

export default async function AdminCommandesPage() {
  const commandes = await getAllCommandes();
  return <ListeCommandesAdmin commandes={commandes} />;
}
