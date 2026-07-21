import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

// ──────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "session";
/** Durée de la session, en secondes. 7 jours. */
const SESSION_DUREE = 60 * 60 * 24 * 7;

/** Encode le secret en bytes pour jose. */
function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET manquant dans .env.local (vois lib/session.ts)"
    );
  }
  return new TextEncoder().encode(secret);
}

// ──────────────────────────────────────────────────────────────────────────
// Forme du contenu utile dans le JWT.
// ──────────────────────────────────────────────────────────────────────────

export type SessionPayload = {
  id: string;
  email: string;
  nom: string;
};

// ──────────────────────────────────────────────────────────────────────────
// Signature / vérification du JWT
// ──────────────────────────────────────────────────────────────────────────

export async function creerToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DUREE}s`)
    .sign(getSecretKey());
}

export async function verifierToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    // On extrait les champs qu'on attend (les autres comme iat/exp sont gérés par jose).
    if (
      typeof payload.id === "string" &&
      typeof payload.email === "string" &&
      typeof payload.nom === "string"
    ) {
      return { id: payload.id, email: payload.email, nom: payload.nom };
    }
    return null;
  } catch {
    // Signature invalide, expiré, ou cassé → on rejette.
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Cookie helpers (server side uniquement : utilise next/headers)
// ──────────────────────────────────────────────────────────────────────────

export async function poserCookieSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    // ⭐ Pas accessible depuis JavaScript côté client : protège contre XSS.
    httpOnly: true,
    // En prod (HTTPS), cookie envoyé uniquement sur connexion sécurisée.
    secure: process.env.NODE_ENV === "production",
    // Empêche l'envoi du cookie en cross-site (protection CSRF basique).
    sameSite: "lax",
    maxAge: SESSION_DUREE,
    path: "/",
  });
}

export async function supprimerCookieSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * À appeler dans n'importe quel composant SERVEUR pour savoir
 * si un utilisateur est connecté (et qui).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifierToken(token);
}
