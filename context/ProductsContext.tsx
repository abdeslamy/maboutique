"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Produit } from "@/lib/types";

// ============================================================================
// ProductsContext
// ============================================================================
// Pattern identique à AuthContext :
//   - Le layout SERVEUR récupère les produits depuis Prisma (async).
//   - Il les passe en prop à <ProductsProvider>.
//   - Les composants CLIENT (CatalogueClient, CartContext...) les consultent
//     via useProducts() — sans jamais parler à Prisma directement.
// ============================================================================

type ProductsContextType = {
  produits: Produit[];
  /** Utilitaire côté client — équivalent de getProduitParId côté serveur. */
  getProduitParId: (id: string) => Produit | undefined;
};

const ProductsContext = createContext<ProductsContextType | null>(null);

export function ProductsProvider({
  produits,
  children,
}: {
  produits: Produit[];
  children: ReactNode;
}) {
  function getProduitParId(id: string): Produit | undefined {
    return produits.find((p) => p.id === id);
  }
  return (
    <ProductsContext.Provider value={{ produits, getProduitParId }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts(): ProductsContextType {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error(
      "useProducts() doit être utilisé à l'intérieur de <ProductsProvider>"
    );
  }
  return ctx;
}
