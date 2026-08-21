import {
  getTarifsLivraison,
  getParametresLivraison,
  grouperTarifs,
} from "@/lib/livraison";
import ConfigurationLivraison from "@/components/admin/ConfigurationLivraison";

/**
 * Onglet "Configuration" (/admin/configuration).
 * Pour l'instant : uniquement la livraison. Les autres sections
 * (catégories, identité, pixels…) viendront s'ajouter ici.
 *
 * Les tarifs sont stockés par wilaya mais PRÉSENTÉS par groupe : on les
 * regroupe ici, côté serveur.
 */
export default async function AdminConfigurationPage() {
  const [tarifs, parametres] = await Promise.all([
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);

  return (
    <ConfigurationLivraison
      groupesInitiaux={grouperTarifs(tarifs)}
      parametresInitiaux={parametres}
    />
  );
}
