import {
  getTarifsLivraison,
  getParametresLivraison,
} from "@/lib/livraison";
import ConfigurationLivraison from "@/components/admin/ConfigurationLivraison";

/**
 * Onglet "Configuration" (/admin/configuration).
 * Pour l'instant : uniquement la livraison. Les autres sections
 * (catégories, identité, pixels…) viendront s'ajouter ici.
 */
export default async function AdminConfigurationPage() {
  const [tarifs, parametres] = await Promise.all([
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);

  return (
    <ConfigurationLivraison
      tarifsInitiaux={tarifs}
      parametresInitiaux={parametres}
    />
  );
}
