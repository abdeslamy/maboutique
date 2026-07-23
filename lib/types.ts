// ──────────────────────────────────────────────────────────────────────────
// Types partagés par tout le projet.
// Ces définitions servent de "contrat" : si quelqu'un manipule un Produit,
// TypeScript impose qu'il ait bien tous les champs déclarés ici.
// ──────────────────────────────────────────────────────────────────────────

/** Catégories de produits supportées dans la boutique. */
export type Categorie = "mode" | "electronique" | "maison";

/** Un texte qui existe dans nos deux langues. */
export type TexteBilingue = {
  fr: string;
  ar: string;
};

/** Un produit du catalogue. */
export type Produit = {
  id: string;
  nom: TexteBilingue;
  description: TexteBilingue;
  /** Prix en dinars algériens (DA), nombre entier. */
  prix: number;
  categorie: Categorie;
  /**
   * Tableau de "vues" du produit, simulées par des classes Tailwind de fond.
   * Premier élément = vignette par défaut. Les autres sont des angles alternatifs.
   * Plus tard, on remplacera par des URLs d'images réelles.
   */
  images: string[];
  /** URL de la vidéo produit, optionnelle. */
  videoUrl?: string;
  /** Petit emoji décoratif affiché par-dessus chaque placeholder. */
  emoji: string;
};

/** Un article dans le panier : référence un produit par son id + une quantité. */
export type ArticlePanier = {
  produitId: string;
  quantite: number;
};

/** Une ligne de commande figée au moment de l'achat (nom et prix copiés). */
export type LigneCommande = {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
};

/** Cycle de vie logistique d'une commande — géré depuis l'admin. */
export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "en_livraison"
  | "livree"
  | "annulee";

/**
 * État du contact client (call center / paiement à la livraison).
 * Indépendant du statut logistique : le statut suit le colis, l'état d'appel
 * suit la relation téléphonique avec le client. Couvre les cas standards du COD.
 */
export type EtatAppel =
  | "non_appele" // pas encore contacté (défaut implicite)
  | "confirme" // le client a confirmé la commande
  | "ne_repond_pas" // appelé, pas de réponse
  | "telephone_eteint" // téléphone fermé / éteint
  | "injoignable" // injoignable après plusieurs tentatives
  | "faux_numero" // numéro incorrect / faux
  | "annule_client" // le client a annulé
  | "report_livraison" // report de livraison demandé
  | "demande_modification" // modification demandée (adresse/produit/qté)
  | "absent_livraison" // absent lors de la livraison
  | "colis_refuse" // colis refusé à la livraison
  | "attente_rappel" // en attente d'être rappelé
  | "doublon"; // doublon de commande

/** Liste ordonnée des états d'appel (pour peupler les selects). */
export const ETATS_APPEL: EtatAppel[] = [
  "non_appele",
  "confirme",
  "ne_repond_pas",
  "telephone_eteint",
  "injoignable",
  "faux_numero",
  "annule_client",
  "report_livraison",
  "demande_modification",
  "absent_livraison",
  "colis_refuse",
  "attente_rappel",
  "doublon",
];

/** Une commande passée par un client. */
export type Commande = {
  id: string;
  /** Date au format ISO 8601 (ex : "2026-06-06T14:32:00.000Z"). */
  date: string;
  /** ID de l'utilisateur connecté (optionnel : commande possible sans compte). */
  utilisateurId?: string;
  articles: LigneCommande[];
  sousTotal: number;
  livraison: number;
  total: number;
  statut: StatutCommande;
  /** État du contact client. undefined = jamais renseigné. */
  etatAppel?: EtatAppel;
  /** Notes libres de l'équipe. undefined = aucune note. */
  notes?: string;
  /**
   * Horodatages des étapes franchies (ISO 8601).
   * Utilisés par la Timeline côté client (page confirmation, compte).
   * undefined = étape pas encore franchie.
   */
  confirmedAt?: string;
  enLivraisonAt?: string;
  livreeAt?: string;
  annuleeAt?: string;
  client: {
    nom: string;
    telephone: string;
    adresse: string;
    wilaya: string;
  };
};

/** Rôle d'un utilisateur (contrôle d'accès admin). */
export type Role = "user" | "admin";

/** Un utilisateur enregistré (stocké dans la table Utilisateur via Prisma). */
export type Utilisateur = {
  id: string;
  email: string;
  nom: string;
  /** Hash bcrypt — JAMAIS le mot de passe en clair. Champ nommé "motDePasse" en base pour rester concis. */
  motDePasse: string;
  /**
   * Photo de profil : base64 (data URL) pour l'instant, URL Cloudinary/UploadThing
   * plus tard. Optionnel — undefined si l'utilisateur n'en a pas uploadé.
   */
  image?: string;
  /** "user" par défaut, "admin" pour toi et les admins. */
  role: Role;
  /** Date de création au format ISO 8601. */
  createdAt: string;
};
