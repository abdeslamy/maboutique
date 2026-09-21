import type { Locale } from "@/i18n/routing";

// Il n'y a plus de frais de livraison fixes. Le prix dépend de la wilaya, du
// mode, et du réglage « livraison offerte » de la boutique — et il peut très
// bien n'être connu qu'au téléphone. Tout cela vit dans lib/livraison-calcul.

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
