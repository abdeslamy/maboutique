/**
 * Valide une destination de retour après connexion.
 *
 * ⚠️ Ce fichier existe pour UNE raison de sécurité : la redirection ouverte.
 *
 * Les écrans d'accès reçoivent la page d'origine dans l'URL
 * (`/connexion?suite=/produits/vase`). Sans contrôle, n'importe qui peut
 * fabriquer `/connexion?suite=https://site-pirate.dz` et envoyer le lien : la
 * victime voit un domaine légitime, se connecte, et se fait rediriger ailleurs
 * — souvent vers une copie du site qui redemande le mot de passe.
 *
 * La règle est donc stricte : on n'accepte QUE des chemins internes.
 *
 *  - doit commencer par une seule barre oblique — `//evil.com` est une URL
 *    protocole-relatif, le navigateur y voit un autre domaine ;
 *  - pas de `\` — certains navigateurs le traitent comme `/`, ce qui rouvre
 *    la faille avec `/\evil.com` ;
 *  - pas d'espace ni de saut de ligne.
 *
 * Tout le reste retombe sur la valeur par défaut. On ne « nettoie » jamais une
 * valeur douteuse : on la jette.
 */
export function cheminDeRetour(
  valeur: string | string[] | undefined | null,
  parDefaut = "/"
): string {
  // Un paramètre répété (`?suite=a&suite=b`) arrive sous forme de tableau. On
  // ne devine pas laquelle est la bonne : on refuse.
  if (typeof valeur !== "string") return parDefaut;

  const chemin = valeur.trim();
  if (!/^\/(?!\/)[^\s\\]*$/.test(chemin)) return parDefaut;

  return chemin;
}

/** Le nom du paramètre, en un seul endroit. */
export const PARAM_SUITE = "suite";

/**
 * Construit le lien vers un écran d'accès en y attachant la page d'origine.
 *
 * `chemin` doit être un chemin SANS préfixe de langue — c'est ce que renvoie
 * `usePathname()` de @/i18n/navigation, et c'est le <Link> localisé qui
 * remettra le préfixe.
 */
export function lienAvecSuite(destination: string, chemin: string): string {
  const suite = cheminDeRetour(chemin, "");
  if (!suite || suite === destination) return destination;
  return `${destination}?${PARAM_SUITE}=${encodeURIComponent(suite)}`;
}
