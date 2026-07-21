import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Le plugin next-intl indique à Next.js où trouver la config i18n côté serveur.
// On lui passe le chemin de notre fichier i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Aucune option custom pour l'instant.
};

// On "enveloppe" la config Next.js avec le plugin pour activer next-intl.
export default withNextIntl(nextConfig);
