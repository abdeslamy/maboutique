// ============================================================================
// Singleton du client Prisma (avec adaptateur Neon serverless)
// ============================================================================
//
// Ce fichier expose UNE seule instance du client Prisma, partagée par tout le
// code du serveur. On l'importe partout avec :
//     import { prisma } from "@/lib/prisma";
//
// Pourquoi un singleton ?
//   - En prod, Next.js démarre une instance de l'app qui vit longtemps.
//     Créer un client Prisma une fois et le réutiliser est parfait.
//   - EN DEV, Next.js recharge le code à chaud (HMR) à chaque changement.
//     Si on faisait `new PrismaClient()` à chaque import, chaque hot reload
//     ouvrirait une nouvelle connexion à Postgres.
//     Résultat : au bout de quelques minutes, la base rejette les nouvelles
//     connexions ("too many connections").
//
// Solution : on stocke le client sur `globalThis` — l'objet global de Node.js,
// qui SURVIT aux hot reloads. Au prochain reload, on réutilise ce qui existe
// déjà au lieu d'en créer un nouveau.
//
// Pourquoi l'adaptateur Neon ?
//   Prisma 7 sépare le "moteur ORM" du "driver réseau". On lui passe donc
//   un adaptateur pour se connecter à la base. `@prisma/adapter-neon` utilise
//   le driver serverless de Neon (HTTP au lieu de TCP), ce qui est
//   parfaitement adapté à Vercel et autres environnements serverless.
// ============================================================================

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Petit garde-fou : sans DATABASE_URL, on ne peut pas créer le client.
// Ça déclenche une erreur claire au démarrage plutôt qu'un plantage plus tard.
function creerClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant dans .env");
  }
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? creerClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
