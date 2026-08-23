-- Livraison offerte au niveau du produit.
ALTER TABLE "Produit" ADD COLUMN "livraisonGratuite" BOOLEAN NOT NULL DEFAULT false;

-- Les categories deviennent des donnees et non plus un type fige.
CREATE TABLE "Categorie" (
  "id"    TEXT NOT NULL,
  "nomFr" TEXT NOT NULL,
  "nomAr" TEXT NOT NULL,
  "ordre" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- On reprend les quatre rayons existants pour que les produits deja en base
-- gardent une categorie valide, et que les filtres continuent de fonctionner.
INSERT INTO "Categorie" ("id", "nomFr", "nomAr", "ordre") VALUES
  ('mode',         'Mode',           'موضة',        0),
  ('electronique', 'Électronique',   'إلكترونيات',  1),
  ('maison',       'Maison & déco',  'منزل ودكور',  2),
  ('camping',      'Camping',        'تخييم',       3)
ON CONFLICT ("id") DO NOTHING;
