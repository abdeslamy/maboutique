-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "annuleeAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "enLivraisonAt" TIMESTAMP(3),
ADD COLUMN     "livreeAt" TIMESTAMP(3);
