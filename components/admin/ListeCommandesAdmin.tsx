"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrix } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import type { Commande, StatutCommande } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import PastilleStatut from "./PastilleStatut";

type FiltreStatut = StatutCommande | "tout";

const FILTRES: FiltreStatut[] = [
  "tout",
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

/**
 * Liste des commandes pour l'admin.
 * - Onglets pour filtrer par statut avec compteur
 * - Recherche par id ou nom client
 */
export default function ListeCommandesAdmin({
  commandes,
}: {
  commandes: Commande[];
}) {
  const t = useTranslations("admin.commandes");
  const locale = useLocale() as Locale;

  const [filtre, setFiltre] = useState<FiltreStatut>("tout");
  const [recherche, setRecherche] = useState("");

  // Compteurs par statut (pour l'affichage sur les onglets)
  const compteurs = useMemo(() => {
    const c: Record<FiltreStatut, number> = {
      tout: commandes.length,
      en_attente: 0,
      confirmee: 0,
      en_livraison: 0,
      livree: 0,
      annulee: 0,
    };
    for (const cmd of commandes) c[cmd.statut]++;
    return c;
  }, [commandes]);

  const commandesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return commandes.filter((c) => {
      if (filtre !== "tout" && c.statut !== filtre) return false;
      if (q) {
        const cible = (c.id + " " + c.client.nom).toLowerCase();
        if (!cible.includes(q)) return false;
      }
      return true;
    });
  }, [commandes, filtre, recherche]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {t("total", { count: commandes.length })}
        </p>
      </header>

      {/* Recherche */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("rechercher")}
          className="w-full rounded-full border border-gray-300 bg-white ps-9 pe-4 py-2 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Onglets par statut */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTRES.map((f) => {
          const actif = filtre === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                actif
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
              }`}
            >
              <span>{t(`filtres.${f}`)}</span>
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  actif ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {compteurs[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {commandesFiltrees.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-500">
          {t("aucuneCommande")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {commandesFiltrees.map((c) => {
            const nbArticles = c.articles.reduce(
              (s, a) => s + a.quantite,
              0
            );
            const wilaya = WILAYAS.find((w) => w.code === c.client.wilaya);
            return (
              <li
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white transition hover:border-gray-400 hover:shadow-sm"
              >
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/admin/commandes/${c.id}` as any}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  {/* Colonne 1 : id + date */}
                  <div className="w-40 shrink-0">
                    <p className="font-mono text-xs text-gray-500">
                      #{c.id.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(c.date).toLocaleDateString(
                        locale === "ar" ? "ar-DZ" : "fr-DZ",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>

                  {/* Colonne 2 : client + wilaya */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {c.client.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {wilaya?.nom[locale] ?? c.client.wilaya} · {c.client.telephone}
                    </p>
                  </div>

                  {/* Colonne 3 : nb articles */}
                  <p className="w-24 shrink-0 text-sm text-gray-600">
                    {nbArticles} {t("articles")}
                  </p>

                  {/* Colonne 4 : total */}
                  <p className="w-28 shrink-0 text-end font-semibold text-black">
                    {formatPrix(c.total, locale)}
                  </p>

                  {/* Colonne 5 : statut */}
                  <div className="w-32 shrink-0 text-end">
                    <PastilleStatut statut={c.statut} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
