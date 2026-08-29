import FormulaireCommande from "@/components/FormulaireCommande";
import { getTarifsLivraison, getParametresLivraison } from "@/lib/livraison";

// Page /commande. Le formulaire est un composant CLIENT (il lit le panier
// depuis le CartContext), donc les tarifs sont chargés ici, côté serveur,
// puis passés en props. Ils servent à AFFICHER le prix en direct ; le prix
// facturé est de toute façon recalculé par le serveur à la création.
export default async function PageCommande() {
  const [tarifs, parametres] = await Promise.all([
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);

  return <FormulaireCommande tarifs={tarifs} parametres={parametres} />;
}
