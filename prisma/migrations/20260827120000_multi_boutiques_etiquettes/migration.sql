-- ═══════════════════════════════════════════════════════════════════════
-- Multi-boutiques — pose des étiquettes (boutiqueId)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Migration écrite à la main : Prisma proposerait de recréer les tables dont
-- la clé primaire change, ce qui effacerait les données. Ici, tout l'existant
-- est CONSERVÉ et rattaché à une première boutique.
--
-- Ordre imposé par les dépendances :
--   1. créer Boutique et y insérer la boutique historique ;
--   2. ajouter les colonnes en NULLABLE ;
--   3. remplir avec l'id de la boutique historique ;
--   4. seulement alors passer en NOT NULL et poser les clés.
-- L'inverse échouerait sur les lignes déjà présentes.

-- ── 1. La table des tenants ────────────────────────────────────────────
CREATE TABLE "Boutique" (
    "id"                 TEXT NOT NULL,
    "nom"                TEXT NOT NULL,
    "slug"               TEXT NOT NULL,
    "statut"             TEXT NOT NULL DEFAULT 'active',
    "visibleMarketplace" BOOLEAN NOT NULL DEFAULT true,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boutique_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Boutique_slug_key" ON "Boutique"("slug");

-- La boutique historique. Id figé et lisible : toutes les commandes SQL de
-- cette migration s'y réfèrent, et on doit pouvoir la reconnaître à l'œil.
INSERT INTO "Boutique" ("id", "nom", "slug")
VALUES ('boutique-1', 'Ma Boutique', 'ma-boutique');

-- ── 2. Produit ─────────────────────────────────────────────────────────
ALTER TABLE "Produit" ADD COLUMN "boutiqueId" TEXT;
UPDATE "Produit" SET "boutiqueId" = 'boutique-1';
ALTER TABLE "Produit" ALTER COLUMN "boutiqueId" SET NOT NULL;

ALTER TABLE "Produit"
    ADD CONSTRAINT "Produit_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Produit_boutiqueId_idx" ON "Produit"("boutiqueId");

-- ── 3. Commande ────────────────────────────────────────────────────────
-- Pas de CASCADE ici : on ne supprime jamais une boutique qui a des
-- commandes. C'est de la comptabilité, elle doit survivre au marchand.
ALTER TABLE "Commande" ADD COLUMN "boutiqueId" TEXT;
UPDATE "Commande" SET "boutiqueId" = 'boutique-1';
ALTER TABLE "Commande" ALTER COLUMN "boutiqueId" SET NOT NULL;

ALTER TABLE "Commande"
    ADD CONSTRAINT "Commande_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Commande_boutiqueId_idx" ON "Commande"("boutiqueId");

-- ── 4. Utilisateur ─────────────────────────────────────────────────────
-- L'unicité de l'email passe de GLOBALE à PAR BOUTIQUE.
ALTER TABLE "Utilisateur" ADD COLUMN "boutiqueId" TEXT;
UPDATE "Utilisateur" SET "boutiqueId" = 'boutique-1';
ALTER TABLE "Utilisateur" ALTER COLUMN "boutiqueId" SET NOT NULL;

DROP INDEX "Utilisateur_email_key";
CREATE UNIQUE INDEX "Utilisateur_boutiqueId_email_key"
    ON "Utilisateur"("boutiqueId", "email");

ALTER TABLE "Utilisateur"
    ADD CONSTRAINT "Utilisateur_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 5. Categorie — la clé primaire devient composite ───────────────────
-- `Produit.categorie` n'est pas une vraie clé étrangère (relation implicite,
-- voir le commentaire du schéma) : changer cette clé primaire ne casse donc
-- aucune contrainte existante.
ALTER TABLE "Categorie" ADD COLUMN "boutiqueId" TEXT;
UPDATE "Categorie" SET "boutiqueId" = 'boutique-1';
ALTER TABLE "Categorie" ALTER COLUMN "boutiqueId" SET NOT NULL;

ALTER TABLE "Categorie" DROP CONSTRAINT "Categorie_pkey";
ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_pkey"
    PRIMARY KEY ("boutiqueId", "id");

ALTER TABLE "Categorie"
    ADD CONSTRAINT "Categorie_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 6. TarifLivraison — clé primaire composite ─────────────────────────
ALTER TABLE "TarifLivraison" ADD COLUMN "boutiqueId" TEXT;
UPDATE "TarifLivraison" SET "boutiqueId" = 'boutique-1';
ALTER TABLE "TarifLivraison" ALTER COLUMN "boutiqueId" SET NOT NULL;

ALTER TABLE "TarifLivraison" DROP CONSTRAINT "TarifLivraison_pkey";
ALTER TABLE "TarifLivraison" ADD CONSTRAINT "TarifLivraison_pkey"
    PRIMARY KEY ("boutiqueId", "wilaya");

ALTER TABLE "TarifLivraison"
    ADD CONSTRAINT "TarifLivraison_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 7. ParametresBoutique — l'id DEVIENT le boutiqueId ─────────────────
-- La ligne unique existante a l'id 'boutique'. On la renomme en
-- 'boutique-1' pour qu'elle pointe sur la vraie boutique, puis la colonne
-- change de nom : elle ne désigne plus un singleton mais un marchand.
UPDATE "ParametresBoutique" SET "id" = 'boutique-1' WHERE "id" = 'boutique';

-- Filet : si aucune ligne n'existait, on en crée une pour la boutique 1.
INSERT INTO "ParametresBoutique" ("id")
SELECT 'boutique-1'
WHERE NOT EXISTS (SELECT 1 FROM "ParametresBoutique" WHERE "id" = 'boutique-1');

ALTER TABLE "ParametresBoutique" RENAME COLUMN "id" TO "boutiqueId";
ALTER TABLE "ParametresBoutique" ALTER COLUMN "boutiqueId" DROP DEFAULT;

ALTER TABLE "ParametresBoutique"
    ADD CONSTRAINT "ParametresBoutique_boutiqueId_fkey"
    FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
