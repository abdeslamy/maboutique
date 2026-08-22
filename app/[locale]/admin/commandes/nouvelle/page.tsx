import { getAllProduits } from "@/lib/products";
import { getTarifsLivraison, getParametresLivraison } from "@/lib/livraison";
import FormulaireNouvelleCommande from "@/components/admin/FormulaireNouvelleCommande";

/**
 * /admin/commandes/nouvelle — saisie manuelle d'une commande.
 * Les trois lectures sont indépendantes : on les lance ensemble.
 */
export default async function PageNouvelleCommande() {
  const [produits, tarifs, parametres] = await Promise.all([
    getAllProduits(),
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);

  return (
    <FormulaireNouvelleCommande
      produits={produits}
      tarifs={tarifs}
      parametres={parametres}
    />
  );
}
