// ──────────────────────────────────────────────────────────────────────────
// Types partagés par tout le projet.
// Ces définitions servent de "contrat" : si quelqu'un manipule un Produit,
// TypeScript impose qu'il ait bien tous les champs déclarés ici.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Catégorie d'un produit : le SLUG d'une ligne de la table Categorie
 * ("mode", "beaute"...). Ce n'est plus une union figée — l'admin compose sa
 * propre liste depuis le catalogue prédéfini (lib/categories-catalogue.ts).
 * La validité est donc vérifiée EN BASE, plus par le compilateur.
 */
export type Categorie = string;

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
  /**
   * Emoji de repli, affiché uniquement pour les produits historiques qui n'ont
   * pas de vraie photo. N'est plus saisi dans le formulaire admin.
   */
  emoji: string;
  /** Stock disponible. 0 = rupture → produit non commandable. */
  stock: number;
  /** Délai annoncé : "48h" | "3_5j" | "1semaine" | "plus_1semaine". */
  delaiLivraison: string;
  /** Livraison offerte sur ce produit, quel que soit le tarif de la wilaya. */
  livraisonGratuite: boolean;
};

/**
 * Version ALLÉGÉE d'un produit, destinée au navigateur.
 *
 * Le catalogue partagé était envoyé en entier dans CHAQUE page — descriptions
 * française et arabe comprises. Mesuré sur 11 produits : 13,2 Ko, dont **59 %
 * de descriptions**, alors qu'aucun composant client ne les affiche. Seule la
 * fiche produit s'en sert, et elle lit son produit séparément.
 *
 * Projection à la même moyenne : 500 produits représentaient 599 Ko envoyés à
 * chaque page, y compris la page de connexion.
 *
 * Ce type est un SOUS-ENSEMBLE strict de `Produit` : tout composant qui
 * accepte un `ProduitResume` accepte aussi un `Produit` complet.
 */
export type ProduitResume = {
  id: string;
  nom: TexteBilingue;
  prix: number;
  categorie: Categorie;
  /**
   * La VIGNETTE seule. Les autres vues du produit ne servent que sur sa
   * fiche, qui les charge elle-même. Le tableau est conservé plutôt qu'une
   * chaîne pour que `images[0]` continue de fonctionner partout.
   */
  images: string[];
  emoji: string;
  stock: number;
  delaiLivraison: string;
  livraisonGratuite: boolean;
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
  /** "domicile" ou "stopdesk", figé au moment de la commande. */
  modeLivraison: string;
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
