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
 * L'enveloppe du panneau.
 *
 * ⚠️ `overflow-hidden` n'est pas un détail. Les cartes débordent
 * VOLONTAIREMENT (décalages négatifs) et se font rogner par les coins
 * arrondis : ce rognage EST le dessin, il donne l'impression d'un cadrage sur
 * une interface plus grande.
 *
 * Pas de `h-full` : le panneau est un élément flex qui s'étire déjà à la
 * hauteur de sa colonne. Un `height: 100%` créerait une dépendance circulaire
 * — la colonne attend la hauteur de son contenu, le contenu attend celle de la
 * colonne.
 *
 * `dir="ltr"` : le contenu est une maquette d'interface en anglais. Sans cette
 * ligne, les cartes se retourneraient en arabe et les libellés seraient mal
 * composés. `aria-hidden` pour la même raison — des chiffres inventés, dans
 * une langue qui n'est pas celle de la page, n'ont rien à annoncer à un
 * lecteur d'écran.
 */
export function Panneau({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="ltr"
      aria-hidden="true"
      className="relative w-full overflow-hidden rounded-[40px] bg-[#fcfaf6]"
      style={{ fontFamily: POLICE_UI, boxShadow: OMBRE.panneau }}
    >
      {children}
    </div>
  );
}
