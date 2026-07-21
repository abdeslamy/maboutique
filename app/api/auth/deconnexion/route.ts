import { NextResponse } from "next/server";
import { supprimerCookieSession } from "@/lib/session";

/**
 * POST /api/auth/deconnexion
 * Supprime simplement le cookie de session côté serveur.
 * Le navigateur ne joindra plus le cookie sur les requêtes suivantes →
 * l'utilisateur est "déconnecté".
 */
export async function POST() {
  await supprimerCookieSession();
  return NextResponse.json({ succes: true });
}
