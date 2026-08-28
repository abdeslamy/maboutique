-- ═══════════════════════════════════════════════════════════════════════
-- Boutique.emailContact — adresse de notification du marchand
-- ═══════════════════════════════════════════════════════════════════════
--
-- Colonne NULLABLE, sans valeur par défaut : une boutique qui n'a pas encore
-- renseigné son adresse continue de fonctionner, l'alerte de commande est
-- simplement sautée. Une commande ne doit jamais échouer parce qu'un e-mail
-- ne peut pas partir.
--
-- Aucune donnée existante n'est touchée.

ALTER TABLE "Boutique" ADD COLUMN "emailContact" TEXT;
