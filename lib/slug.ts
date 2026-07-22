/**
 * Utilitaire pur JavaScript — SANS dépendance à Prisma ou à Node.js.
 * Peut être importé côté serveur ET côté client.
 *
 * Transforme une chaîne en "slug" utilisable comme id URL.
 * Ex : "T-shirt Blanc en Coton" → "t-shirt-blanc-en-coton"
 *  - retire les accents
 *  - passe en minuscules
 *  - remplace ce qui n'est pas [a-z0-9] par un tiret
 *  - trim les tirets aux extrémités
 */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
