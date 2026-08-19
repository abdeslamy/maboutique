-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "modeLivraison" TEXT NOT NULL DEFAULT 'domicile';

-- CreateTable
CREATE TABLE "TarifLivraison" (
    "wilaya" TEXT NOT NULL,
    "prixDomicile" INTEGER NOT NULL,
    "prixStopdesk" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TarifLivraison_pkey" PRIMARY KEY ("wilaya")
);

-- CreateTable
CREATE TABLE "ParametresBoutique" (
    "id" TEXT NOT NULL DEFAULT 'boutique',
    "seuilLivraisonGratuite" INTEGER,
    "delaiMin" INTEGER NOT NULL DEFAULT 3,
    "delaiMax" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "ParametresBoutique_pkey" PRIMARY KEY ("id")
);
