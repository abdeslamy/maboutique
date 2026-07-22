import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { creerProduit, slugifier, type EntreeProduit } from "@/lib/products";
import type { Categorie } from "@/lib/types";

const CATEGORIES_VALIDES: Categorie[] = ["mode", "electronique", "maison"];

/**
 * POST /api/admin/produits
 * Body : { id?, nomFr, nomAr, descriptionFr, descriptionAr, prix, categorie, images[], emoji, videoUrl? }
 *
 * Sécurité : garde admin (garde stricte, on ne fait PAS confiance au JWT pour le rôle).
 * Si `id` n'est pas fourni, on le génère depuis nomFr (slug).
 */
export async function POST(req: NextRequest) {
  // ── Garde admin ──────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const user = await getUtilisateurParId(session.id);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  // ── Parsing + validation ─────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const donnees = validerEntree(body);
  if ("erreur" in donnees) {
    return NextResponse.json({ erreur: donnees.erreur }, { status: 400 });
  }

  // ── Création ─────────────────────────────────────────────────────────
  const resultat = await creerProduit(donnees);
  if (!resultat.ok) {
    const status = resultat.erreur === "id_existe" ? 409 : 400;
    return NextResponse.json({ erreur: resultat.erreur }, { status });
  }

  return NextResponse.json(
    { succes: true, produit: resultat.produit },
    { status: 201 }
  );
}

// ────────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────────

export function validerEntree(
  body: Record<string, unknown>
): EntreeProduit | { erreur: string } {
  const nomFr = String(body.nomFr ?? "").trim();
  const nomAr = String(body.nomAr ?? "").trim();
  const descriptionFr = String(body.descriptionFr ?? "").trim();
  const descriptionAr = String(body.descriptionAr ?? "").trim();

  if (nomFr.length < 2) return { erreur: "nom_fr_court" };
  if (nomAr.length < 2) return { erreur: "nom_ar_court" };
  if (descriptionFr.length < 5) return { erreur: "description_fr_courte" };
  if (descriptionAr.length < 5) return { erreur: "description_ar_courte" };

  const prixNum = Number(body.prix);
  if (!Number.isInteger(prixNum) || prixNum < 1) {
    return { erreur: "prix_invalide" };
  }

  const categorie = String(body.categorie ?? "") as Categorie;
  if (!CATEGORIES_VALIDES.includes(categorie)) {
    return { erreur: "categorie_invalide" };
  }

  const images = Array.isArray(body.images)
    ? body.images.filter((u): u is string => typeof u === "string")
    : [];
  if (images.length === 0) return { erreur: "images_manquantes" };

  const emoji = String(body.emoji ?? "").trim() || "📦";
  const videoUrl = body.videoUrl ? String(body.videoUrl).trim() : undefined;

  const idBrut = String(body.id ?? "").trim();
  const id = idBrut ? slugifier(idBrut) : slugifier(nomFr);
  if (!id) return { erreur: "id_invalide" };

  return {
    id,
    nomFr,
    nomAr,
    descriptionFr,
    descriptionAr,
    prix: prixNum,
    categorie,
    images,
    emoji,
    videoUrl,
  };
}
