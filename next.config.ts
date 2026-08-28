import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Le plugin next-intl indique à Next.js où trouver la config i18n côté serveur.
// On lui passe le chemin de notre fichier i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Compte Cloudinary qui héberge les photos produit. Ce n'est pas un secret —
// il figure dans chaque URL d'image — mais le pattern doit lui être RESTREINT :
// autoriser `res.cloudinary.com` en entier ferait de notre optimiseur un relais
// gratuit pour n'importe quel compte Cloudinary du monde.
const compteCloudinary = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    // Liste blanche des sources distantes. Sans elle, `next/image` refuse
    // toute URL externe — c'est volontaire côté Next.js.
    remotePatterns: compteCloudinary
      ? [new URL(`https://res.cloudinary.com/${compteCloudinary}/**`)]
      : // Repli si la variable manque au build : on reste fonctionnel plutôt
        // que de servir un site sans aucune image. Plus large, donc à éviter.
        [new URL("https://res.cloudinary.com/**")],

    // Depuis Next.js 16, ce champ doit être déclaré : sans restriction, un
    // tiers pourrait faire générer autant de variantes qu'il veut à notre
    // serveur. 75 est la valeur par défaut, et suffit largement ici.
    qualities: [75],
  },

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
