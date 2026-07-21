import type { Locale } from "@/i18n/routing";

/**
 * Frais de livraison fixes, en DA.
 * Toujours utiliser cette constante — jamais "500" en dur dans le code.
 * Si on change le tarif, il suffit de modifier ici et tout le site s'aligne.
 */
export const FRAIS_LIVRAISON = 500;

/**
 * Formate un montant en DA selon la locale.
 *  - FR : "9 900 DA"
 *  - AR : "9 900 د.ج"  (chiffres occidentaux, comme en pratique en Algérie)
 *
 * @param montant Nombre entier en DA (ex : 9900)
 * @param locale  "fr" ou "ar"
 */
export function formatPrix(montant: number, locale: Locale): string {
  // Intl.NumberFormat est l'API native pour formater des nombres.
  // "fr-FR" donne un séparateur des milliers en ESPACE (ce qu'on veut dans les deux langues).
  // maximumFractionDigits = 0 : pas de décimales (DA est une monnaie entière).
  const nombre = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(montant);

  const devise = locale === "ar" ? "د.ج" : "DA";
  return `${nombre} ${devise}`;
}
