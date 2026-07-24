"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * Barre de recherche affichée dans le hero de la page d'accueil.
 *
 * Comportement : on saisit → Entrée (ou clic sur le bouton) → redirige vers
 * /produits?q=<terme>. La page /produits lit ce paramètre et pré-remplit son
 * propre champ de recherche (voir CatalogueClient).
 *
 * Design :
 *  - Grande carte arrondie blanche avec ombre douce
 *  - Icône loupe intégrée dans le champ (côté "start" pour respecter LTR/RTL)
 *  - Bouton noir compact à droite : icône seule sur mobile, texte + icône sur ≥sm
 *  - Anneau de focus discret sur toute la carte quand le champ est actif
 */
export default function BarreRechercheHome() {
  const t = useTranslations("accueil");
  const router = useRouter();
  const [q, setQ] = useState("");

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const terme = q.trim();
    // Toujours partir vers /produits, avec ou sans terme —
    // un champ vide amène à la liste complète.
    if (terme) {
      router.push(`/produits?q=${encodeURIComponent(terme)}`);
    } else {
      router.push("/produits");
    }
  }

  return (
    <form
      onSubmit={soumettre}
      role="search"
      className="group mx-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-gray-200 bg-white p-2 shadow-sm transition focus-within:border-gray-400 focus-within:shadow-md"
    >
      {/* Icône loupe à gauche (start = gauche en FR, droite en AR) */}
      <Search
        className="ms-3 h-5 w-5 shrink-0 text-gray-400 transition group-focus-within:text-gray-700"
        aria-hidden="true"
      />

      {/* Champ texte — occupe tout l'espace restant */}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("recherchePlaceholder")}
        aria-label={t("rechercher")}
        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-base"
      />

      {/* Bouton envoyer — icône seule sur mobile, texte + icône sur desktop */}
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:px-5"
      >
        <Search className="h-4 w-4 sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">{t("rechercher")}</span>
      </button>
    </form>
  );
}
