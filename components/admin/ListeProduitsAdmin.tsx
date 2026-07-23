"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { formatPrix } from "@/lib/format";
import type { Produit } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { useLocale } from "next-intl";

/**
 * Liste admin des produits :
 *  - Recherche en temps réel
 *  - Boutons Modifier / Supprimer par ligne
 *  - Bouton "Nouveau produit" en haut
 *
 * useTransition permet d'afficher un état "en cours" pendant la suppression
 * sans bloquer l'UI. router.refresh() recharge la liste depuis le serveur
 * après suppression réussie.
 */
export default function ListeProduitsAdmin({
  produitsInitiaux,
}: {
  produitsInitiaux: Produit[];
}) {
  const t = useTranslations("admin.produits");
  const tCat = useTranslations("categories");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [recherche, setRecherche] = useState("");
  const [enSuppression, startTransition] = useTransition();

  const produitsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return produitsInitiaux;
    return produitsInitiaux.filter(
      (p) =>
        p.nom[locale].toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [recherche, produitsInitiaux, locale]);

  async function supprimer(produit: Produit) {
    if (!confirm(t("confirmSupprimer", { nom: produit.nom[locale] }))) return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/produits/${produit.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert(t("erreurs.suppression"));
        return;
      }
      // Recharge les données côté serveur (la liste se met à jour).
      router.refresh();
    });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("titre")}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("total", { count: produitsInitiaux.length })}
          </p>
        </div>
        <Link
          href="/admin/produits/nouveau"
          className="inline-flex items-center gap-2 self-start rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          {t("nouveau")}
        </Link>
      </header>

      {/* Barre de recherche */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("rechercher")}
          className="w-full rounded-full border border-gray-300 bg-white ps-9 pe-4 py-2 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Liste des produits */}
      {produitsFiltres.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-500">
          {recherche ? t("aucunResultat") : t("aucunProduit")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {produitsFiltres.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-gray-400 hover:shadow-sm"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Vignette */}
                {p.images[0]?.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl sm:h-20 sm:w-20 sm:text-3xl ${
                      p.images[0] ?? "bg-gray-100"
                    }`}
                    aria-hidden="true"
                  >
                    <span>{p.emoji}</span>
                  </div>
                )}

                {/* Nom + catégorie */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-gray-900">
                    {p.nom[locale]}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {tCat(p.categorie)}
                  </span>
                  {/* Prix desktop uniquement (mobile a le prix en bas) */}
                  <p className="mt-1 hidden text-sm font-semibold text-black sm:block">
                    {formatPrix(p.prix, locale)}
                  </p>
                </div>

                {/* Actions (toujours à droite) */}
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/produits/${p.id}/edit`}
                    className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                    aria-label={t("modifier")}
                    title={t("modifier")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => supprimer(p)}
                    disabled={enSuppression}
                    className="rounded-full p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    aria-label={t("supprimer")}
                    title={t("supprimer")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Prix mobile uniquement — sur ligne séparée pour maximiser l'espace */}
              <p className="mt-3 border-t border-gray-100 pt-3 text-end text-base font-semibold text-black sm:hidden">
                {formatPrix(p.prix, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
