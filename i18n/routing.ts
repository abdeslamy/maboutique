import { defineRouting } from "next-intl/routing";

// Source de vérité du multilingue.
// Toute l'app (middleware, layouts, sélecteur de langue) lit ces valeurs ici.
export const routing = defineRouting({
  // Liste des langues supportées par le site.
  locales: ["fr", "ar"],

  // Langue affichée par défaut quand l'utilisateur arrive sur "/".
  defaultLocale: "fr",
});

// Type utilitaire : représente une locale valide ("fr" ou "ar").
// Pratique pour typer les paramètres dans le reste de l'app.
export type Locale = (typeof routing.locales)[number];
