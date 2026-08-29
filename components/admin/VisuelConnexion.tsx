import Image from "next/image";
import visuel from "@/public/connexion-marchand-visuel.png";

/**
 * Le panneau décoratif de la page de connexion marchand — ce qu'on aperçoit
 * « derrière le rideau ».
 *
 * C'est une IMAGE, pas du code. Le fichier fait 1168 × 1576, soit exactement
 * deux fois la boîte de 584 × 788 de la maquette : le rapport tombe juste,
 * rien n'est déformé, et c'est assez pour un écran à haute densité.
 *
 * ⚠️ Son texte est en ANGLAIS et gravé dedans. Choix assumé : le même visuel
 * sert les deux langues. Il ne se traduit donc pas, et ne se retourne pas en
 * arabe — c'est de la décoration, pas du contenu.
 *
 * D'où `alt=""`. Une image décorative dont le texte ne correspond ni à la
 * langue de la page ni à de vraies données n'a rien à annoncer : un lecteur
 * d'écran lirait des chiffres inventés dans la mauvaise langue. L'attribut vide
 * la fait ignorer, ce qui est exactement le comportement voulu.
 */
export default function VisuelConnexion() {
  return (
    // Pas de `h-full` ici, et c'est le point délicat.
    //
    // Cette boîte est un élément flex qui s'étire déjà à la hauteur de sa
    // colonne. Lui donner `height: 100%` créait une dépendance circulaire — la
    // colonne attend la hauteur de son contenu, le contenu attend celle de la
    // colonne — que le navigateur tranche en repassant l'image sur ses
    // proportions naturelles. Résultat mesuré : 865 px au lieu de 718, et la
    // page se mettait à défiler sur un portable.
    <div
      className="relative w-full overflow-hidden rounded-[40px] bg-[#f7f4ef]"
      style={{
        boxShadow: "0 18px 44px rgba(52,42,28,.10), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      <Image
        src={visuel}
        alt=""
        // `fill` sort l'image du flux (position absolue, calée sur les quatre
        // côtés). C'est ce qui casse la boucle : elle ne pèse plus rien dans le
        // calcul de hauteur, la boîte suit donc sa colonne, et l'image se règle
        // sur la boîte.
        fill
        // `preload` remplace `priority`, déprécié depuis Next 16 — vérifié dans
        // la documentation embarquée (image.md). Le panneau occupe la moitié de
        // l'écran au premier rendu : il ne doit pas arriver après coup.
        preload
        // L'import statique fournit la version floutée affichée pendant le
        // chargement, ce qui évite le rectangle vide.
        placeholder="blur"
        // Le `0px` n'est pas cosmétique : le panneau est masqué en display:none
        // sous 1180 px, mais le préchargement aurait tout de même tiré l'image.
        // Cette règle fait choisir au téléphone la plus petite variante —
        // quelques centaines d'octets au lieu de deux cents kilos.
        sizes="(min-width: 1180px) 640px, 0px"
        // `cover` et non `contain` : entre 1180 et 1440 px la colonne est plus
        // étroite que la boîte de référence, l'image est alors rognée sur ses
        // bords plutôt que déformée. C'est déjà l'idiome de la maquette, où les
        // cartes débordent volontairement.
        className="object-cover"
      />
    </div>
  );
}
