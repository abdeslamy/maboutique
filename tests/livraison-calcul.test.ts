import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculerLivraison,
  modeDisponible,
  grouperTarifs,
  aplatirGroupes,
  type TarifWilaya,
  type ParametresLivraison,
} from "@/lib/livraison-calcul";

/**
 * Les trois règles de la livraison, verrouillées par des tests.
 *
 * Pourquoi celles-ci : `calculerLivraison` est appelée aux DEUX bouts — le
 * navigateur affiche son résultat au client, le serveur facture le sien. Un
 * écart entre les deux ne se voit pas à l'écran, il se voit sur la facture.
 *
 * Le piège à éviter est la confusion entre `0` et `null` : « la livraison est
 * offerte » et « on ne connaît pas encore le prix » sont deux situations
 * opposées, que JavaScript rend faciles à mélanger (les deux sont « faux »).
 *
 * Lancer : npm test
 */

const OFFERTE: ParametresLivraison = { livraisonGratuite: true };
const PAYANTE: ParametresLivraison = { livraisonGratuite: false };

/** Alger : les deux modes sont tarifés. */
const ALGER: TarifWilaya = {
  wilaya: "16",
  prixDomicile: 400,
  prixStopdesk: 250,
};

/** Tamanrasset : bureau seulement, le vendeur n'y livre pas à l'adresse. */
const BUREAU_SEUL: TarifWilaya = {
  wilaya: "11",
  prixDomicile: null,
  prixStopdesk: 900,
};

// ── Règle 1 — la gratuité prime sur tout ────────────────────────────────

test("règle 1 : livraison offerte = 0 DA, même sur une wilaya tarifée", () => {
  assert.equal(calculerLivraison(ALGER, "domicile", OFFERTE), 0);
  assert.equal(calculerLivraison(ALGER, "stopdesk", OFFERTE), 0);
});

test("règle 1 : livraison offerte = 0 DA, même sans aucun tarif", () => {
  // Le cas qui compte : une boutique qui offre la livraison n'a RIEN à
  // confirmer au téléphone, même si elle n'a jamais rempli sa grille.
  assert.equal(calculerLivraison(undefined, "domicile", OFFERTE), 0);
  assert.equal(calculerLivraison(undefined, "stopdesk", OFFERTE), 0);
});

// ── Règle 2 — le tarif de la wilaya s'applique ──────────────────────────

test("règle 2 : chaque mode facture son propre prix", () => {
  assert.equal(calculerLivraison(ALGER, "domicile", PAYANTE), 400);
  assert.equal(calculerLivraison(ALGER, "stopdesk", PAYANTE), 250);
});

test("règle 2 : un tarif à 0 DA reste 0 DA, et non « inconnu »", () => {
  const offertParLeVendeur: TarifWilaya = {
    wilaya: "16",
    prixDomicile: 0,
    prixStopdesk: 0,
  };
  // 0 est un montant, pas une absence de montant. Si ce test tombe, c'est
  // qu'un `||` s'est glissé là où il fallait un `??`.
  assert.equal(calculerLivraison(offertParLeVendeur, "domicile", PAYANTE), 0);
});

// ── Règle 3 — pas de tarif : montant inconnu, jamais de blocage ─────────

test("règle 3 : wilaya sans tarif = null, pas un prix inventé", () => {
  assert.equal(calculerLivraison(undefined, "domicile", PAYANTE), null);
  assert.equal(calculerLivraison(undefined, "stopdesk", PAYANTE), null);
});

test("règle 3 : les deux modes restent ouverts sur une wilaya sans tarif", () => {
  // Ne rien savoir d'une destination n'est pas une raison de refuser la
  // commande. C'est toute la différence avec l'ancien comportement, qui
  // renvoyait false et fermait la wilaya.
  assert.equal(modeDisponible(undefined, "domicile"), true);
  assert.equal(modeDisponible(undefined, "stopdesk"), true);
});

test("le domicile reste fermé sur une wilaya tarifée sans prix à domicile", () => {
  // Ici le vendeur s'est prononcé : il n'assure pas le domicile. On respecte
  // son choix — c'est un refus explicite, pas une information manquante.
  assert.equal(modeDisponible(BUREAU_SEUL, "domicile"), false);
  assert.equal(modeDisponible(BUREAU_SEUL, "stopdesk"), true);
  assert.equal(calculerLivraison(BUREAU_SEUL, "stopdesk", PAYANTE), 900);
});

// ── Groupes : ce que l'admin manipule ↔ ce que la base stocke ───────────

test("grouper puis aplatir redonne les mêmes tarifs", () => {
  const tarifs: TarifWilaya[] = [
    { wilaya: "16", prixDomicile: 400, prixStopdesk: 250 },
    { wilaya: "09", prixDomicile: 400, prixStopdesk: 250 },
    { wilaya: "11", prixDomicile: null, prixStopdesk: 900 },
  ];
  const groupes = grouperTarifs(tarifs);
  // Deux prix distincts → deux groupes, le plus gros en tête.
  assert.equal(groupes.length, 2);
  assert.deepEqual(groupes[0].wilayas, ["16", "09"]);

  const retour = aplatirGroupes(groupes);
  assert.deepEqual(
    [...retour].sort((a, b) => a.wilaya.localeCompare(b.wilaya)),
    [...tarifs].sort((a, b) => a.wilaya.localeCompare(b.wilaya))
  );
});

test("un prix à domicile absent ne se confond pas avec un prix à 0", () => {
  // `null` et `0` produisent des clés de regroupement différentes, sinon une
  // wilaya « pas de livraison à domicile » se retrouverait groupée avec une
  // wilaya « domicile offert » — et facturée comme elle.
  const groupes = grouperTarifs([
    { wilaya: "11", prixDomicile: null, prixStopdesk: 900 },
    { wilaya: "01", prixDomicile: 0, prixStopdesk: 900 },
  ]);
  assert.equal(groupes.length, 2);
});
