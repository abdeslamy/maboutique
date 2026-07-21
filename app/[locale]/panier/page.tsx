import PanierClient from "@/components/PanierClient";

// Page /panier — l'intégralité du rendu est dans PanierClient (composant client
// qui lit le CartContext). La page elle-même reste minimaliste.
export default function PagePanier() {
  return <PanierClient />;
}
