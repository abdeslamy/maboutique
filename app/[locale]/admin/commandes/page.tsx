import { getAllCommandes } from "@/lib/orders";
import { getAllProduits } from "@/lib/products";
import { getTarifsLivraison, getParametresLivraison } from "@/lib/livraison";
import ListeCommandesAdmin from "@/components/admin/ListeCommandesAdmin";

/**
 * /admin/commandes — liste + fenêtre de saisie manuelle.
 * Produits et tarifs sont chargés ici pour alimenter le formulaire de la
 * fenêtre, qui est un composant client.
 */
export default async function AdminCommandesPage() {
  const [commandes, produits, tarifs, parametres] = await Promise.all([
    getAllCommandes(),
    getAllProduits(),
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);

  return (
    <ListeCommandesAdmin
      commandes={commandes}
      produits={produits}
      tarifs={tarifs}
      parametres={parametres}
    />
  );
}
