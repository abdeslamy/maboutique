import { NextResponse, type NextRequest } from "next/server";
import { getProduitsResume } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { contient, correctionProche } from "@/lib/recherche";
import { routing, type Locale } from "@/i18n/routing";
import type { ProduitResume } from "@/lib/types";

/**
 * GET /api/recherche?q=…&locale=fr&format=mobile
 *
 * La recherche se faisait ENTIÈREMENT dans le navigateur, sur un catalogue
 * chargé en entier dans chaque page. Elle vit désormais ici.
 *
 * Ce que ça change :
 *  - plus une ligne de catalogue n'est envoyée tant que l'utilisateur n'ouvre
 *    pas la recherche ;
 *  - le coût cesse d'être proportionnel à la taille du catalogue POUR TOUT LE
 *    MONDE, et devient proportionnel au nombre de gens qui cherchent.
 *
 * ⚠️ Le filtrage reste fait EN MÉMOIRE, après avoir lu tout le catalogue. Ce
 * n'est donc pas encore une vraie recherche indexée : c'est la même logique,
 * déplacée côté serveur. Le gain est celui du transport, pas celui du calcul.
 * L'étape d'après est un index (Postgres full-text, ou Meilisearch) — mais
 * elle n'a de sens qu'une fois le transport réglé, sinon on indexerait pour
 * ensuite tout renvoyer au navigateur.
 */

/** Nombre de suggestions de complétion, par format d'affichage. */
const MAX_SUGGESTIONS = { mobile: 3, tablette: 3, desktop: 8 } as const;
/** Produits renvoyés. Le total exact est transmis à part, pour « Voir les N ». */
const MAX_RESULTATS = { mobile: 24, tablette: 24, desktop: 8 } as const;
/** Vitrine affichée tant que le champ est vide. */
const TAILLE_VITRINE = { mobile: 4, tablette: 6, desktop: 6 } as const;

type Format = keyof typeof MAX_SUGGESTIONS;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim();

  const locale: Locale = routing.locales.includes(params.get("locale") as Locale)
    ? (params.get("locale") as Locale)
    : routing.defaultLocale;

  const brut = params.get("format");
  const format: Format =
    brut === "desktop" || brut === "tablette" ? brut : "mobile";

  // `getProduitsResume` et `getCategories` sont déjà cloisonnées par boutique :
  // le garde-fou refuserait toute requête qui ne le serait pas.
  const [produits, categories] = await Promise.all([
    getProduitsResume(),
    getCategories(),
  ]);

  const libelle = (c: { nomFr: string; nomAr: string }) =>
    locale === "ar" ? c.nomAr : c.nomFr;
  const rayonDe = (p: ProduitResume) => {
    const c = categories.find((x) => x.id === p.categorie);
    return c ? libelle(c) : "";
  };

  // ── Champ vide : la vitrine ────────────────────────────────────────
  if (!q) {
    return NextResponse.json({
      vide: true,
      vitrine: produits.slice(0, TAILLE_VITRINE[format]),
      categories,
    });
  }

  // ── Recherche ──────────────────────────────────────────────────────
  // Nom + rayon, comme avant : le rayon tient lieu de marque, absente du
  // modèle produit.
  const resultats = produits.filter((p) =>
    contient(`${p.nom[locale]} ${rayonDe(p)}`, q)
  );

  const corpus = Array.from(
    new Set(
      [...produits.map((p) => p.nom[locale]), ...categories.map(libelle)].filter(
        Boolean
      )
    )
  );

  return NextResponse.json({
    vide: false,
    produits: resultats.slice(0, MAX_RESULTATS[format]),
    total: resultats.length,
    suggestions: corpus
      .filter((s) => contient(s, q))
      .slice(0, MAX_SUGGESTIONS[format]),
    rayons: categories.filter((c) => contient(libelle(c), q)).slice(0, 4),
    correction: correctionProche(q, corpus),
    categories,
  });
}
