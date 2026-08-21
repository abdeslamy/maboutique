-- ============================================================================
-- Tarifs par GROUPE de wilayas + delai de livraison par produit
-- ============================================================================
--
-- ORDRE VOLONTAIRE : on cree d abord les lignes manquantes, ENSUITE seulement
-- on supprime la colonne "actif".
--
-- Pourquoi : la nouvelle regle est "presence de la ligne = wilaya desservie".
-- Avant cette migration, une wilaya sans ligne retombait sur 500 DA et etait
-- livrable. Sans cette insertion prealable, les wilayas sans ligne
-- deviendraient d un coup NON DESSERVIES et la boutique cesserait de prendre
-- des commandes ailleurs que dans les rares wilayas deja enregistrees.
--
-- 500 DA reprend exactement le tarif applique jusqu ici : comportement
-- inchange pour le client.

INSERT INTO "TarifLivraison" ("wilaya", "prixDomicile", "prixStopdesk") VALUES
  ('01', 500, 500),
  ('02', 500, 500),
  ('03', 500, 500),
  ('04', 500, 500),
  ('05', 500, 500),
  ('06', 500, 500),
  ('07', 500, 500),
  ('08', 500, 500),
  ('09', 500, 500),
  ('10', 500, 500),
  ('11', 500, 500),
  ('12', 500, 500),
  ('13', 500, 500),
  ('14', 500, 500),
  ('15', 500, 500),
  ('16', 500, 500),
  ('17', 500, 500),
  ('18', 500, 500),
  ('19', 500, 500),
  ('20', 500, 500),
  ('21', 500, 500),
  ('22', 500, 500),
  ('23', 500, 500),
  ('24', 500, 500),
  ('25', 500, 500),
  ('26', 500, 500),
  ('27', 500, 500),
  ('28', 500, 500),
  ('29', 500, 500),
  ('30', 500, 500),
  ('31', 500, 500),
  ('32', 500, 500),
  ('33', 500, 500),
  ('34', 500, 500),
  ('35', 500, 500),
  ('36', 500, 500),
  ('37', 500, 500),
  ('38', 500, 500),
  ('39', 500, 500),
  ('40', 500, 500),
  ('41', 500, 500),
  ('42', 500, 500),
  ('43', 500, 500),
  ('44', 500, 500),
  ('45', 500, 500),
  ('46', 500, 500),
  ('47', 500, 500),
  ('48', 500, 500),
  ('49', 500, 500),
  ('50', 500, 500),
  ('51', 500, 500),
  ('52', 500, 500),
  ('53', 500, 500),
  ('54', 500, 500),
  ('55', 500, 500),
  ('56', 500, 500),
  ('57', 500, 500),
  ('58', 500, 500)
ON CONFLICT ("wilaya") DO NOTHING;

-- Une wilaya volontairement desactivee ne doit plus etre livree : on retire
-- sa ligne avant de perdre l information portee par "actif".
DELETE FROM "TarifLivraison" WHERE "actif" = false;

ALTER TABLE "TarifLivraison" DROP COLUMN "actif";

-- Le delai n est plus global : il se regle produit par produit.
ALTER TABLE "ParametresBoutique" DROP COLUMN "delaiMin";
ALTER TABLE "ParametresBoutique" DROP COLUMN "delaiMax";

ALTER TABLE "Produit" ADD COLUMN "delaiLivraison" TEXT NOT NULL DEFAULT E'3_5j';
