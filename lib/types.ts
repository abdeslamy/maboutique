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

/** Cycle de vie d'une commande — géré depuis l'admin. */
export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "en_livraison"
  | "livree"
  | "annulee";

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
