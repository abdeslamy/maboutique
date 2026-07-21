"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

/** Utilisateur "publiable" — seules les infos qu'on accepte d'envoyer au client. */
export type UtilisateurPublic = {
  id: string;
  email: string;
  nom: string;
  /** Photo de profil en base64 (data URL), facultative. Alias "image" comme en base. */
  image?: string;
};

type ResultatConnexion =
  | { ok: true }
  | { ok: false; cleErreur: string };

type AuthContextType = {
  utilisateur: UtilisateurPublic | null;
  seConnecter: (email: string, motDePasse: string) => Promise<ResultatConnexion>;
  seDeconnecter: () => Promise<void>;
  /** Met à jour l'utilisateur côté client (après modification réussie via l'API). */
  rafraichirUtilisateur: (modifs: Partial<UtilisateurPublic>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  utilisateurInitial,
  children,
}: {
  utilisateurInitial: UtilisateurPublic | null;
  children: ReactNode;
}) {
  const [utilisateur, setUtilisateur] = useState<UtilisateurPublic | null>(
    utilisateurInitial
  );

  async function seConnecter(
    email: string,
    motDePasse: string
  ): Promise<ResultatConnexion> {
    try {
      const res = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, cleErreur: data.erreur ?? "erreur_serveur" };
      }
      setUtilisateur(data.utilisateur);
      return { ok: true };
    } catch {
      return { ok: false, cleErreur: "erreur_serveur" };
    }
  }

  async function seDeconnecter() {
    try {
      await fetch("/api/auth/deconnexion", { method: "POST" });
    } catch {
      // peu importe : on déconnecte côté client de toute façon
    }
    setUtilisateur(null);
  }

  function rafraichirUtilisateur(modifs: Partial<UtilisateurPublic>) {
    setUtilisateur((prev) => (prev ? { ...prev, ...modifs } : prev));
  }

  return (
    <AuthContext.Provider
      value={{ utilisateur, seConnecter, seDeconnecter, rafraichirUtilisateur }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() doit être utilisé à l'intérieur de <AuthProvider>");
  }
  return ctx;
}
