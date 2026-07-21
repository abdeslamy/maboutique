import FormulaireCommande from "@/components/FormulaireCommande";

// Page /commande : tout est dans FormulaireCommande (composant client car
// il lit le panier depuis le CartContext).
export default function PageCommande() {
  return <FormulaireCommande />;
}
