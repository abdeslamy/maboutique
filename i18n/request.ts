import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Cette fonction est appelée par next-intl, côté serveur, à chaque requête.
// Son rôle : déterminer la locale active et fournir les traductions correspondantes.
export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` vient de l'URL (ex. /fr/produits → "fr").
  // Il faut l'attendre (await) car c'est une Promise dans Next.js 15+.
  const requested = await requestLocale;

  // Sécurité : si la locale demandée n'existe pas, on retombe sur la langue par défaut.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // On charge dynamiquement le bon fichier JSON de traductions.
    // Ex. locale = "ar" → on lit messages/ar.json
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
