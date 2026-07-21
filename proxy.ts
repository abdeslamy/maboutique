import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Le "proxy" (anciennement "middleware" jusqu'à Next.js 15) intercepte
// chaque requête AVANT qu'elle n'atteigne une page.
// Ici, on l'utilise pour gérer le multilingue via l'URL :
// - "/" → redirige vers "/fr" (langue par défaut)
// - "/produits" → redirige vers "/fr/produits"
// - "/fr/..." ou "/ar/..." → laisse passer
export default createMiddleware(routing);

// "matcher" indique sur QUELLES URLs le middleware doit s'activer.
// On exclut explicitement :
//   - /api  → les routes back-end (pas besoin de locale)
//   - /_next → fichiers internes de Next.js
//   - tout chemin qui contient un point (favicon.ico, images, .css, .js, etc.)
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
