import { test } from "node:test";
import assert from "node:assert/strict";
import { cheminDeRetour, lienAvecSuite } from "@/lib/redirection";

/**
 * Le premier test du projet, et il porte sur la seule fonction dont une
 * régression serait une FAILLE et non un défaut d'affichage.
 *
 * `cheminDeRetour` tient six lignes. C'est précisément le danger : quelqu'un
 * la trouvera « trop stricte » un jour, assouplira la condition, et rien ne
 * s'en apercevra — la page continuera de marcher, elle sera simplement devenue
 * un tremplin vers n'importe quel site.
 *
 * Lancer : npm test
 * (lanceur intégré de Node, via tsx pour les alias TypeScript. Aucun paquet
 * supplémentaire.)
 */

// Construites par code : aucun échappement de shell ou d'éditeur à traverser.
const BS = String.fromCharCode(92); // barre inversée
const LF = String.fromCharCode(10);
const TAB = String.fromCharCode(9);

test("accepte les chemins internes", () => {
  for (const chemin of [
    "/",
    "/produits",
    "/produits/vase-terre-cuite",
    "/panier?x=1",
    "/compte#commandes",
    // Une page interne au nom trompeur reste interne : on va bien chez nous.
    "/site-pirate.dz",
  ]) {
    assert.equal(cheminDeRetour(chemin), chemin, `devrait accepter ${chemin}`);
  }
});

test("rogne les espaces autour d'un chemin valide", () => {
  assert.equal(cheminDeRetour(" /produits "), "/produits");
});

test("REFUSE tout ce qui pourrait quitter le domaine", () => {
  const hostiles = [
    "https://site-pirate.dz",
    "http://site-pirate.dz",
    // Protocole-relatif : le navigateur y voit un autre domaine.
    "//site-pirate.dz",
    "///site-pirate.dz",
    // Certains navigateurs lisent la barre inversée comme une barre oblique.
    "/" + BS + "site-pirate.dz",
    BS + BS + "site-pirate.dz",
    "/a" + BS + "b",
    "javascript:alert(1)",
    "data:text/html,x",
    // Relatif sans barre : résolu depuis la page courante, imprévisible.
    "produits",
    "",
    // Injection par saut de ligne.
    "/produits" + LF + "Set-Cookie: x",
    "/produits" + TAB + "x",
  ];

  for (const hostile of hostiles) {
    assert.equal(
      cheminDeRetour(hostile),
      "/",
      `devrait refuser ${JSON.stringify(hostile)}`
    );
  }
});

test("refuse ce qui n'est pas une chaîne", () => {
  assert.equal(cheminDeRetour(undefined), "/");
  assert.equal(cheminDeRetour(null), "/");
  // Paramètre répété (?suite=a&suite=b) : on ne devine pas laquelle est la
  // bonne, on refuse.
  assert.equal(cheminDeRetour(["/a", "/b"]), "/");
});

test("respecte la valeur par défaut fournie", () => {
  assert.equal(cheminDeRetour("https://site-pirate.dz", "/compte"), "/compte");
  assert.equal(cheminDeRetour("/panier", "/compte"), "/panier");
});

test("lienAvecSuite n'attache qu'un chemin propre", () => {
  assert.equal(
    lienAvecSuite("/connexion", "/produits/vase"),
    "/connexion?suite=%2Fproduits%2Fvase"
  );
  // Une origine hostile est jetée : le lien reste nu plutôt que de transporter
  // une valeur douteuse.
  assert.equal(lienAvecSuite("/connexion", "//site-pirate.dz"), "/connexion");
  // Pas de boucle sur soi-même.
  assert.equal(lienAvecSuite("/connexion", "/connexion"), "/connexion");
});
