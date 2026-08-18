import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Le plugin next-intl indique à Next.js où trouver la config i18n côté serveur.
// On lui passe le chemin de notre fichier i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Cache client des segments déjà visités.
    // Depuis Next 15, `dynamic` vaut 0 s par DÉFAUT : toute page dynamique
    // (les nôtres le sont, elles lisent le cookie de session) était donc
    // entièrement re-demandée au serveur à CHAQUE clic d'onglet.
    // 30 s suffisent pour rendre les allers-retours entre onglets instantanés,
    // sans risque de données périmées : chaque mutation appelle router.refresh()
    // qui invalide ce cache immédiatement.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

// On "enveloppe" la config Next.js avec le plugin pour activer next-intl.
export default withNextIntl(nextConfig);
