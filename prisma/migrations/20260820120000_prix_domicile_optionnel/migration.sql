-- Prix a domicile facultatif : NULL signifie "pas de livraison a domicile"
-- pour ce groupe de wilayas (retrait au bureau uniquement).
-- Changement NON destructif : les valeurs existantes sont conservees.
ALTER TABLE "TarifLivraison" ALTER COLUMN "prixDomicile" DROP NOT NULL;
