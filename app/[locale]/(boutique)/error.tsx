"use client";

// La page d'erreur de la boutique — voir not-found.tsx juste à côté pour le
// pourquoi de cette ré-exportation.
//
// "use client" est répété ici : une frontière d'erreur doit en être une, et
// Next.js lit la directive dans le fichier qu'il charge, pas dans celui qui
// est ré-exporté.
export { default } from "../error";
