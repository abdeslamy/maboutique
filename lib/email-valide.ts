/**
 * Validation d'adresse e-mail — fonction PURE, sans aucune dépendance.
 *
 * Elle vit dans son propre fichier parce qu'elle est utilisée des DEUX côtés :
 * le formulaire d'administration (navigateur) et la route qui enregistre
 * (serveur). Deux expressions régulières distinctes finiraient par diverger,
 * et le formulaire accepterait ce que l'API refuse.
 *
 * ⚠️ Ne PAS l'importer depuis `lib/boutique.ts` côté client : ce fichier
 * importe Prisma, et l'y faire entrer embarquerait tout le client de base de
 * données dans le bundle du navigateur.
 *
 * Volontairement permissive : une expression régulière ne dira jamais si une
 * adresse existe — seul un e-mail réellement reçu le prouve. Elle écarte les
 * fautes de frappe grossières, rien de plus.
 */
export function emailPlausible(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur.trim());
}
