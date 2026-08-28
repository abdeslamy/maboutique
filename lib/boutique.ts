import { cache } from "react";

/**
 * Quelle boutique sert la requête en cours ?
 *
 * C'est le SEUL endroit du projet qui répond à cette question. Tout le reste
 * du code appelle `boutiqueActuelle()` sans savoir comment la réponse est
 * obtenue.
 *
 * Aujourd'hui : il n'y a qu'une boutique, la réponse est constante.
 *
 * Demain, quand chaque marchand aura son domaine, cette fonction lira l'hôte
 * de la requête (`tyradam.com`, `coursa.maplateforme.dz`,
 * `maplateforme.dz/coursa`) et le traduira en identifiant de boutique.
 * **Ce fichier changera. Les trente autres appelants, non.**
 *
 * C'est toute la raison d'être de cette indirection : sans elle, écrire
 * « boutique-1 » à trente endroits imposerait de retrouver ces trente
 * endroits le jour des domaines — et il suffirait d'en oublier un pour
 * qu'un marchand voie les données d'un autre.
 *
 * `cache()` mémorise le résultat pour la durée d'UN rendu serveur : la
 * résolution (qui interrogera la base plus tard) n'a lieu qu'une fois par
 * requête, même si vingt fonctions la demandent.
 */

/**
 * Boutique historique, créée par la migration `multi_boutiques_etiquettes`.
 * Exportée pour les scripts hors requête (seed, maintenance) qui n'ont pas
 * d'hôte à interroger et doivent donc la nommer explicitement.
 */
export const BOUTIQUE_PAR_DEFAUT = "boutique-1";

/**
 * Asynchrone dès aujourd'hui, alors que la réponse est constante : la vraie
 * résolution devra lire les en-têtes de la requête et consulter la base,
 * deux opérations asynchrones. Rendre la fonction synchrone maintenant
 * obligerait à modifier les trente appelants le jour où elle ne peut plus
 * l'être — exactement ce qu'on cherche à éviter.
 */
export const boutiqueActuelle = cache(async function boutiqueActuelle(): Promise<string> {
  return BOUTIQUE_PAR_DEFAUT;
});
