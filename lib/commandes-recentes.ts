import { cookies } from "next/headers";

/**
 * Trace des commandes que CE navigateur vient de passer.
 *
 * ─── Le problème ───────────────────────────────────────────────────────
 * La page de confirmation affiche le nom, le téléphone et l'adresse du
 * client. Elle se contentait de lire l'identifiant dans l'URL : quiconque
 * possédait le lien voyait ces informations.
 *
 * Les identifiants sont des `cuid()` de 25 caractères, donc indevinables —
 * mais un lien recopié dans une conversation, un historique partagé ou un
 * en-tête `Referer` suffisait à les exposer.
 *
 * ─── Pourquoi pas simplement « il faut être connecté » ─────────────────
 * Parce que la commande sans compte est un cas normal et fréquent :
 * `Commande.utilisateurId` est optionnel. Exiger une session priverait de
 * confirmation le client qui vient précisément de commander.
 *
 * ─── La solution ───────────────────────────────────────────────────────
 * À la création d'une commande, son identifiant est déposé dans un cookie
 * `httpOnly`. La page de confirmation n'ouvre alors que si :
 *   - la commande appartient à l'utilisateur connecté, OU
 *   - son identifiant figure dans ce cookie.
 *
 * Posséder le lien ne suffit donc plus.
 *
 * ⚠️ Ce cookie n'est pas signé, et il n'a pas à l'être : il ne fait
 * qu'AUTORISER un identifiant qu'il faut de toute façon connaître. Le
 * falsifier exige de deviner un cuid — exactement la barrière qui existait
 * déjà. Le cookie ne peut donc rien affaiblir, seulement ajouter.
 */

const COOKIE = "commandes-recentes";
/** Au-delà, on oublie les plus anciennes : le cookie doit rester petit. */
const MAX = 12;
/** 60 jours — le temps qu'une commande soit livrée et son suivi consulté. */
const DUREE = 60 * 60 * 24 * 60;

function lire(brut: string | undefined): string[] {
  if (!brut) return [];
  try {
    const v: unknown = JSON.parse(brut);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    // Cookie corrompu ou d'un ancien format : on repart de zéro plutôt que
    // de refuser l'accès à quelqu'un qui vient de commander.
    return [];
  }
}

/** Identifiants des commandes passées depuis ce navigateur. */
export async function getCommandesRecentes(): Promise<string[]> {
  const store = await cookies();
  return lire(store.get(COOKIE)?.value);
}

/**
 * Retient une commande. À appeler juste après sa création.
 * Ne fonctionne que dans un Route Handler ou une Server Action — un
 * composant serveur ne peut pas écrire de cookie.
 */
export async function memoriserCommande(id: string): Promise<void> {
  const store = await cookies();
  const liste = [id, ...lire(store.get(COOKIE)?.value).filter((x) => x !== id)];
  store.set(COOKIE, JSON.stringify(liste.slice(0, MAX)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DUREE,
    path: "/",
  });
}

/** Ce navigateur a-t-il le droit de voir cette commande ? */
export async function peutVoirCommande(id: string): Promise<boolean> {
  return (await getCommandesRecentes()).includes(id);
}
