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

/** Hauteur libre : le viewport moins les 56 px de marge en haut et en bas. */
const HAUTEUR = "calc(100vh - 7rem)";

export default function VisuelConnexion() {
  return (
    // ── La boîte est pilotée par la HAUTEUR, pas par la largeur ────────────
    //
    // C'était le défaut : la boîte occupait toute la largeur de sa colonne, un
    // rapport plus large que celui de l'image, et `object-cover` rognait la
    // différence — 167 px de hauteur perdus, soit les fiches produit du bas.
    //
    // Ici la hauteur vient du viewport et la largeur découle du rapport de
    // l'image. Les deux rapports coïncident donc toujours : rien n'est jamais
    // rogné ni déformé, et les débordements voulus par la maquette restent
    // coupés par les coins arrondis, comme prévu.
    //
    // Ce n'est pas un compromis : à la taille de référence de 1440 × 900, la
    // hauteur libre vaut 788 px, et 788 × 1168/1576 = 584 — exactement la
    // largeur de colonne de la maquette. La boîte la remplit au pixel.
    //
    // `max-w-full` couvre le cas d'une fenêtre étroite mais haute, où la
    // largeur ainsi calculée dépasserait la colonne. La boîte se laisse alors
    // borner, et `object-contain` évite toute déformation.
    //
    // Pas de pourcentage de hauteur : `h-full` créait une dépendance
    // circulaire — la colonne attend la hauteur de son contenu, le contenu
    // attend celle de la colonne — que le navigateur tranchait en repassant
    // l'image sur ses proportions naturelles.
    <div
      className="relative aspect-[1168/1576] max-w-full shrink-0 overflow-hidden rounded-[40px] bg-[#f7f4ef]"
      style={{
        height: HAUTEUR,
        boxShadow: "0 18px 44px rgba(52,42,28,.10), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      <Image
        src={visuel}
        alt=""
        // `fill` sort l'image du flux : elle ne pèse rien dans le calcul de
        // hauteur et se règle sur la boîte.
        fill
        // `preload` remplace `priority`, déprécié depuis Next 16 — vérifié dans
        // la documentation embarquée (image.md). Le panneau occupe la moitié de
        // l'écran au premier rendu : il ne doit pas arriver après coup.
        preload
        // L'import statique fournit la version floutée affichée pendant le
        // chargement, ce qui évite le rectangle vide.
        placeholder="blur"
        // ⚠️ Cette ligne décide de la NETTETÉ. Une valeur fixe de 640 px faisait
        // télécharger une variante trop petite : mesurée à 656 px de large sur
        // un écran ordinaire, l'image était déjà agrandie — et deux fois plus
        // sur un écran à haute densité. `50vw` majore la largeur réelle de la
        // colonne, le navigateur choisit donc toujours une variante suffisante.
        //
        // Le `1px` du second cas n'est pas cosmétique : le panneau est masqué
        // en display:none sous 1180 px, mais le préchargement aurait tout de
        // même tiré l'image. Cette règle fait choisir au téléphone la plus
        // petite variante disponible.
        sizes="(min-width: 1180px) 50vw, 1px"
        // `contain` et non `cover` : les deux rapports coïncidant, il n'y a
        // rien à rogner dans le cas normal. La différence ne joue que dans le
        // cas borné ci-dessus, où `contain` préserve les proportions.
        className="object-contain"
      />
    </div>
  );
}
