import Image from "next/image";
import visuel from "@/public/connexion-marchand-visuel.png";

/**
 * Le panneau décoratif de la page de connexion marchand — ce qu'on aperçoit
 * « derrière le rideau ».
 *
 * C'est une IMAGE, pas du code. Elle sort de Claude Design et fait 2336 × 3152,
 * soit exactement quatre fois la boîte de 584 × 788 de la maquette : le rapport
 * tombe juste, rien n'est déformé ni recadré à la taille de référence.
 *
 * Pourquoi une image plutôt qu'un rendu en SVG : la version codée reproduisait
 * la composition « à quelques pixels près ». Ici c'est le dessin d'origine,
 * exact, ombres et chevauchements compris.
 *
 * ⚠️ Son texte est en ANGLAIS et gravé dedans. Choix assumé : le même visuel
 * sert les deux langues. Il ne se traduit donc pas, et ne se retourne pas en
 * arabe — c'est de la décoration, pas du contenu.
 *
 * D'où `alt=""`. Une image décorative dont le texte ne correspond ni à la
 * langue de la page ni à de vraies données n'a rien à annoncer : un lecteur
 * d'écran lirait des chiffres inventés dans la mauvaise langue. L'attribut vide
 * la fait ignorer, ce qui est exactement le comportement voulu.
 *
 * `object-cover` plutôt que `contain` : entre 1180 et 1440 px la colonne est
 * plus étroite que la boîte de référence, et l'image est alors rognée sur ses
 * bords — précisément l'idiome de la maquette, où les cartes débordent déjà.
 * Elle ne se déforme jamais.
 *
 * Masqué sous 1180 px (voir la page) : sur un écran étroit, le formulaire
 * prend toute la place.
 */
export default function VisuelConnexion() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[40px] bg-[#f7f4ef]"
      style={{
        boxShadow: "0 18px 44px rgba(52,42,28,.10), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      <Image
        src={visuel}
        alt=""
        // `preload` remplace `priority`, déprécié depuis Next 16 — vérifié dans
        // la documentation embarquée (image.md). Le panneau occupe la moitié de
        // l'écran au premier rendu : il ne doit pas arriver après coup.
        preload
        // L'import statique fournit les dimensions ET une version floutée
        // affichée pendant le chargement, ce qui évite le rectangle vide.
        placeholder="blur"
        // Une seule colonne, jamais plus de 640 px de large en pratique.
        sizes="(min-width: 1180px) 640px, 0px"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
