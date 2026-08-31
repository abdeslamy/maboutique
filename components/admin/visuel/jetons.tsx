/**
 * Le vocabulaire visuel commun aux deux panneaux décoratifs — connexion et
 * ouverture de boutique.
 *
 * Extrait pour une raison précise : les ombres à trois valeurs et la géométrie
 * des cartes sont ce qui fait tenir le dessin. Recopiées d'un fichier à
 * l'autre, elles auraient divergé au premier ajustement, et l'écart ne se
 * serait vu que sur une comparaison côte à côte.
 */

/** Pile typographique de l'interface — celle de la maquette, pas celle du site. */
export const POLICE_UI = "-apple-system, 'SF Pro Text', Helvetica, sans-serif";

/**
 * Ombres à trois valeurs. Une ombre simple aplatirait l'empilement : c'est la
 * combinaison d'une ombre large et diffuse avec une ombre courte et dense qui
 * donne sa profondeur au dessin.
 */
export const OMBRE = {
  panneau: "0 18px 44px rgba(52,42,28,.10), 0 2px 6px rgba(52,42,28,.04)",
  principale: "0 20px 44px rgba(52,42,28,.12), 0 2px 5px rgba(52,42,28,.04)",
  notification: "0 16px 36px rgba(52,42,28,.14), 0 2px 5px rgba(52,42,28,.04)",
  liste: "0 16px 36px rgba(52,42,28,.12), 0 2px 5px rgba(52,42,28,.04)",
  produits: "0 20px 44px rgba(52,42,28,.13), 0 2px 5px rgba(52,42,28,.04)",
} as const;

/**
 * L'enveloppe vit désormais dans PanneauEchelle.tsx : elle a besoin de mesurer
 * sa propre taille pour mettre la composition à l'échelle, ce qui en fait un
 * composant client. Les constantes ci-dessus restent ici, utilisables par les
 * composants serveur.
 */
