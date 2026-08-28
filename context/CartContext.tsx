"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { FRAIS_LIVRAISON } from "@/lib/format";
import type { ArticlePanier, ProduitResume } from "@/lib/types";

// ──────────────────────────────────────────────────────────────────────────
// Clé sous laquelle on enregistre le panier dans localStorage du navigateur.
// Si on changeait cette clé, les anciens paniers seraient "oubliés".
// ──────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "panier-ma-boutique";

// Un article du panier "enrichi" avec son objet Produit (utile pour l'affichage).
export type ArticleAvecProduit = ArticlePanier & { produit: ProduitResume };

// Forme du Context : ce qu'on rend disponible à toute l'app.
type CartContextType = {
  /** Articles bruts (id + quantité), tels qu'ils sont stockés en localStorage. */
  articles: ArticlePanier[];
  /** Articles avec leur objet Produit joint — prêt à afficher. */
  articlesEnrichis: ArticleAvecProduit[];
  /** Ajoute un produit (ou augmente sa quantité s'il est déjà dans le panier). */
  ajouter: (produitId: string, quantite?: number) => void;
  /** Remplace la quantité d'un produit. Si quantite <= 0, supprime l'article. */
  modifierQuantite: (produitId: string, quantite: number) => void;
  /** Retire un produit du panier. */
  supprimer: (produitId: string) => void;
  /** Vide tout le panier. */
  vider: () => void;
  /** Nombre TOTAL d'articles dans le panier (somme des quantités). */
  nombreArticles: number;
  /** Somme du prix × quantité de tous les articles, en DA. */
  sousTotal: number;
  /** Frais de livraison (0 si panier vide, sinon FRAIS_LIVRAISON). */
  livraison: number;
  /** sousTotal + livraison, en DA. */
  total: number;
  /** True quand le panier a fini d'être chargé depuis localStorage. */
  estCharge: boolean;
};

// Le Context. On lui donne null par défaut (qui veut dire "pas de Provider").
// Toute consommation hors d'un <CartProvider> déclenchera une erreur claire.
const CartContext = createContext<CartContextType | null>(null);

// ──────────────────────────────────────────────────────────────────────────
// Le Provider : composant qui "ouvre" le canal au sommet de l'app.
// Tout ce qui est dans `children` peut appeler useCart() pour accéder
// au panier.
// ──────────────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  // Le panier ne dépend PLUS du catalogue global.
  //
  // Il lisait auparavant `useProducts()`, ce qui obligeait chaque page du
  // site à transporter tout le catalogue — uniquement pour qu'un badge de
  // navigation puisse s'afficher. Or ce badge n'a besoin que du NOMBRE
  // d'articles, qui se calcule depuis le stockage local seul.
  //
  // Les détails (nom, prix, vignette) ne sont demandés que lorsque le panier
  // n'est pas vide, et seulement pour les produits qu'il contient.
  const [produits, setProduits] = useState<ProduitResume[]>([]);

  // L'état du panier vit ici, dans ce composant client.
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  // Tant qu'on n'a pas chargé localStorage, on évite d'afficher des
  // informations qui pourraient différer du rendu serveur (cf. hydration).
  const [estCharge, setEstCharge] = useState(false);

  // ── Effet 1 : charger localStorage UNE FOIS au montage ───────────────
  // Dépendances vides [] = ne s'exécute qu'une seule fois.
  useEffect(() => {
    try {
      const brut = localStorage.getItem(STORAGE_KEY);
      if (brut) {
        const lu = JSON.parse(brut) as ArticlePanier[];
        if (Array.isArray(lu)) setArticles(lu);
      }
    } catch {
      // localStorage indisponible (mode privé, etc.) ou JSON cassé → on ignore.
    }
    setEstCharge(true);
  }, []);

  // ── Effet 2 : sauvegarder dans localStorage à chaque changement ──────
  // On évite d'écraser localStorage tant qu'on ne l'a pas lu au moins une fois
  // (sinon on remplacerait un panier existant par un tableau vide au démarrage).
  useEffect(() => {
    if (!estCharge) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch {
      // localStorage plein ou indisponible — on ignore.
    }
  }, [articles, estCharge]);

  // ── Actions sur le panier ─────────────────────────────────────────────
  function ajouter(produitId: string, quantite = 1) {
    setArticles((prev) => {
      const existant = prev.find((a) => a.produitId === produitId);
      if (existant) {
        // Déjà présent → on incrémente la quantité.
        return prev.map((a) =>
          a.produitId === produitId
            ? { ...a, quantite: a.quantite + quantite }
            : a
        );
      }
      // Nouveau produit → on l'ajoute à la fin du tableau.
      return [...prev, { produitId, quantite }];
    });
  }

  function modifierQuantite(produitId: string, quantite: number) {
    if (quantite <= 0) {
      supprimer(produitId);
      return;
    }
    setArticles((prev) =>
      prev.map((a) => (a.produitId === produitId ? { ...a, quantite } : a))
    );
  }

  function supprimer(produitId: string) {
    setArticles((prev) => prev.filter((a) => a.produitId !== produitId));
  }

  function vider() {
    setArticles([]);
  }

  // ── Effet 3 : détails des produits du panier ─────────────────────────
  // Déclenché par la LISTE DES IDENTIFIANTS, pas par `articles` : changer une
  // quantité ne doit pas relancer une requête réseau.
  const cleIds = articles
    .map((a) => a.produitId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!estCharge) return;
    if (cleIds === "") {
      setProduits([]);
      return;
    }
    // `annule` évite d'appliquer une réponse tardive alors que le panier a
    // déjà changé — sinon deux requêtes rapides peuvent revenir dans le
    // désordre et réafficher un état périmé.
    let annule = false;
    fetch(`/api/produits?ids=${encodeURIComponent(cleIds)}`)
      .then((r) => (r.ok ? r.json() : { produits: [] }))
      .then((d) => {
        if (!annule) setProduits(d.produits ?? []);
      })
      .catch(() => {
        // Réseau indisponible : le panier garde son compte et ses quantités,
        // seuls les libellés manquent. Mieux vaut un panier incomplet qu'un
        // panier qui disparaît.
      });
    return () => {
      annule = true;
    };
  }, [cleIds, estCharge]);

  // ── Valeurs calculées (mémorisées pour ne pas recalculer à chaque rendu) ──
  const articlesEnrichis = useMemo(() => {
    return articles
      .map((a) => {
        const produit = produits.find((p) => p.id === a.produitId);
        return produit ? { ...a, produit } : null;
      })
      .filter((a): a is ArticleAvecProduit => a !== null);
  }, [articles, produits]);

  const sousTotal = useMemo(
    () => articlesEnrichis.reduce((s, a) => s + a.produit.prix * a.quantite, 0),
    [articlesEnrichis]
  );

  const nombreArticles = useMemo(
    () => articles.reduce((s, a) => s + a.quantite, 0),
    [articles]
  );

  const livraison = articlesEnrichis.length > 0 ? FRAIS_LIVRAISON : 0;
  const total = sousTotal + livraison;

  return (
    <CartContext.Provider
      value={{
        articles,
        articlesEnrichis,
        ajouter,
        modifierQuantite,
        supprimer,
        vider,
        nombreArticles,
        sousTotal,
        livraison,
        total,
        estCharge,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Custom hook : tout composant qui veut accéder au panier appelle useCart().
// Plus joli et plus sûr que d'appeler useContext(CartContext) à la main.
// ──────────────────────────────────────────────────────────────────────────
export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error(
      "useCart() doit être utilisé à l'intérieur de <CartProvider>"
    );
  }
  return ctx;
}
