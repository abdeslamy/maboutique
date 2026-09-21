-- ═══════════════════════════════════════════════════════════════════════
-- Livraison : un interrupteur au lieu d'un seuil, et des frais qui peuvent
-- rester inconnus au moment de la commande.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. « Livraison gratuite » devient un interrupteur.
--
-- L'ancien seuil en dinars disparaît. Seul le cas seuil = 0 signifiait
-- « offerte quoi qu'il arrive » : c'est le seul qu'on peut reporter sans
-- trahir l'intention du marchand. Un seuil de 5000 DA n'est PAS une
-- livraison gratuite, on le laisse donc retomber sur false — le marchand
-- reverra son réglage, plutôt que d'offrir la livraison sans le savoir.
ALTER TABLE "ParametresBoutique"
  ADD COLUMN "livraisonGratuite" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ParametresBoutique"
  SET "livraisonGratuite" = true
  WHERE "seuilLivraisonGratuite" = 0;

ALTER TABLE "ParametresBoutique"
  DROP COLUMN "seuilLivraisonGratuite";

-- 2. Les frais de livraison d'une commande peuvent être inconnus.
--
-- NULL = la boutique n'avait pas de tarif pour cette wilaya ; le montant
-- sera annoncé lors de l'appel de confirmation. Les commandes déjà en base
-- gardent leur montant : elles ont toutes été créées du temps où une wilaya
-- sans tarif était refusée.
ALTER TABLE "Commande"
  ALTER COLUMN "livraison" DROP NOT NULL;
