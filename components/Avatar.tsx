"use client";

/**
 * Avatar utilisateur :
 *  - Si une photo est fournie → on l'affiche (img base64).
 *  - Sinon → cercle coloré avec l'initiale du nom.
 *
 * La couleur du fond est déterminée par un mini-hash du nom — toujours la même
 * pour un nom donné, ce qui donne une identité visuelle stable.
 */

const COULEURS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

function couleurDeNom(nom: string): string {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 1000;
  return COULEURS[somme % COULEURS.length];
}

export default function Avatar({
  nom,
  image,
  taille = "md",
}: {
  nom: string;
  image?: string;
  taille?: "sm" | "md" | "lg";
}) {
  const taillesPx = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-20 w-20 text-2xl",
  }[taille];

  const initiale = (nom.trim()[0] ?? "?").toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={nom}
        className={`${taillesPx} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${taillesPx} ${couleurDeNom(
        nom
      )} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      aria-label={nom}
    >
      {initiale}
    </span>
  );
}
