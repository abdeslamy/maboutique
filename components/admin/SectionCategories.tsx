"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Check, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
// categories-catalogue est sans Prisma : importable côté client.
import {
  CATALOGUE_CATEGORIES,
  type CategorieCatalogue,
} from "@/lib/categories-catalogue";
import type { Locale } from "@/i18n/routing";

/**
 * Rayons de la boutique.
 *
 * L'admin choisit dans une liste FERMÉE, jamais en saisie libre. Raisons :
 *  - la boutique est bilingue, et une traduction arabe approximative passerait
 *    inaperçue pour qui ne lit pas la langue ;
 *  - la saisie libre fabrique des doublons (« Électronique », « High-tech »)
 *    qui éclatent les filtres ;
 *  - le slug sert d'identifiant en base, il doit rester propre et stable.
 */

export default function SectionCategories({
  categoriesInitiales,
}: {
  /** Slugs déjà retenus par la boutique, dans l'ordre d'affichage. */
  categoriesInitiales: string[];
}) {
  const t = useTranslations("admin.categories");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [choisies, setChoisies] = useState<string[]>(categoriesInitiales);
  const [fenetreOuverte, setFenetreOuverte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const parId = useMemo(
    () => new Map(CATALOGUE_CATEGORIES.map((c) => [c.id, c])),
    []
  );

  const modifie =
    JSON.stringify(choisies) !== JSON.stringify(categoriesInitiales);

  const nom = (c: CategorieCatalogue) => (locale === "ar" ? c.nomAr : c.nomFr);

  async function enregistrer() {
    setEnvoi(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: choisies }),
      });
      const data = await res.json();
      setMessage(res.ok ? "ok" : data.erreur ?? "erreur_serveur");
      if (res.ok) router.refresh();
    } catch {
      setMessage("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="mb-6 rounded-3xl bg-stone-50 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h2>
        <p className="text-sm text-gray-500">{t("aide")}</p>
      </div>

      {/* Rayons retenus, sous forme de pastilles retirables. */}
      {choisies.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-white px-6 py-10 text-center text-sm text-gray-500">
          {t("aucune")}
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {choisies.map((id) => {
            const c = parId.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 ps-3.5 pe-1.5 text-sm text-gray-900"
              >
                {c ? nom(c) : id}
                <button
                  type="button"
                  onClick={() => {
                    setChoisies((prev) => prev.filter((x) => x !== id));
                    setMessage(null);
                  }}
                  aria-label={t("retirer")}
                  title={t("retirer")}
                  className="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setFenetreOuverte(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-stone-100"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {t("ajouter")}
        </button>

        <div className="flex flex-wrap items-center gap-3 sm:ms-auto">
          {message === "ok" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" strokeWidth={2} />
              {t("enregistre")}
            </span>
          )}
          {message && message !== "ok" && (
            <span className="text-sm font-medium text-red-600">
              {t.has(`erreurs.${message}`)
                ? t(`erreurs.${message}`)
                : t("erreurs.erreur_serveur")}
            </span>
          )}
          <button
            type="button"
            onClick={enregistrer}
            disabled={envoi || !modifie}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {t("enregistrer")}
          </button>
        </div>
      </div>

      {fenetreOuverte && (
        <SelecteurCategories
          selection={choisies}
          onAnnuler={() => setFenetreOuverte(false)}
          onValider={(ids) => {
            setChoisies(ids);
            setMessage(null);
            setFenetreOuverte(false);
          }}
        />
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Fenêtre de choix — même gabarit que celle des wilayas
// ────────────────────────────────────────────────────────────────────

function SelecteurCategories({
  selection,
  onValider,
  onAnnuler,
}: {
  selection: string[];
  onValider: (ids: string[]) => void;
  onAnnuler: () => void;
}) {
  const t = useTranslations("admin.categories");
  const locale = useLocale() as Locale;
  const [choisies, setChoisies] = useState<Set<string>>(new Set(selection));
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onAnnuler();
    }
    document.addEventListener("keydown", surTouche);
    const initial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = initial;
    };
  }, [onAnnuler]);

  const nom = (c: CategorieCatalogue) => (locale === "ar" ? c.nomAr : c.nomFr);

  const affichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return CATALOGUE_CATEGORIES;
    return CATALOGUE_CATEGORIES.filter(
      (c) =>
        c.nomFr.toLowerCase().includes(q) ||
        c.nomAr.includes(q) ||
        c.id.includes(q)
    );
  }, [recherche]);

  // Les rayons déjà en boutique remontent en tête : c'est ce que l'admin
  // vérifie en premier pour éviter d'ajouter deux fois la même chose.
  const dejaEnBoutique = new Set(selection);
  const ordonnees = [
    ...affichees.filter((c) => dejaEnBoutique.has(c.id)),
    ...affichees.filter((c) => !dejaEnBoutique.has(c.id)),
  ];

  function basculer(id: string) {
    setChoisies((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("annuler")}
        onClick={onAnnuler}
        className="absolute inset-0 h-full w-full cursor-default bg-gray-900/40"
      />

      <div className="relative flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white sm:max-h-[80vh] sm:max-w-lg sm:rounded-3xl">
        <div className="px-6 pt-7">
          <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">
            {t("choisir")}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">{t("choisirAide")}</p>
        </div>

        <div className="relative mt-5 px-6">
          <Search
            className="pointer-events-none absolute start-9 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("rechercher")}
            className="w-full rounded-full bg-stone-50 py-2.5 ps-10 pe-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-6 py-2">
          {ordonnees.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              {t("aucunResultat")}
            </p>
          ) : (
            <ul className="flex flex-col">
              {ordonnees.map((c) => {
                const deja = dejaEnBoutique.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={choisies.has(c.id)}
                        onChange={() => basculer(c.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-gray-900"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900">
                          {nom(c)}
                        </span>
                        {deja && (
                          <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">
                            {t("dejaAjoutee")}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-100 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={() => onValider([...choisies])}
            className="w-full rounded-full bg-gray-900 py-3.5 text-[15px] font-medium text-white transition hover:bg-gray-700"
          >
            {t("valider")} ({choisies.size})
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="mt-2 w-full rounded-full py-2.5 text-sm font-medium text-gray-600 transition hover:bg-stone-100"
          >
            {t("annuler")}
          </button>
        </div>
      </div>
    </div>
  );
}
