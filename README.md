# Ma Boutique — E-commerce Next.js FR/AR

Site e-commerce bilingue français/arabe (RTL natif), livraison Algérie.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **next-intl** pour le multilingue (FR + AR avec RTL)
- **Prisma** + **PostgreSQL** (Neon serverless)
- **bcryptjs** + **JWT** (jose) pour l'auth
- **lucide-react** pour les icônes

## Variables d'environnement requises

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Neon en pooled mode) |
| `SESSION_SECRET` | Secret aléatoire pour signer les JWT de session |

## Développement local

```bash
npm install
npx prisma migrate dev    # créer/mettre à jour les tables
npx prisma db seed        # insérer les produits de démo
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Outils utiles

```bash
npx prisma studio         # interface web pour explorer la base
npx prisma migrate dev    # créer une nouvelle migration après modification du schéma
```

## Déploiement

Compatible **Vercel** en un clic — assurer que `DATABASE_URL` et `SESSION_SECRET` sont bien définis dans les variables d'environnement du projet Vercel.
