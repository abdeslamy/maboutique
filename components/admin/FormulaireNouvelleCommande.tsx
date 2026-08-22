"use client";

import { useState } from "react";
import { Plus, Trash2, Store, Home } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import BoutonRetour from "@/components/BoutonRetour";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrix } from "@/lib/format";
// livraison-calcul est sans Prisma : importable côté client.
import {
  calculerLivraison,
  modeDisponible,
  type TarifWilaya,
  type ParametresLivraison,
  type ModeLivraison,
} from "@/lib/livraison-calcul";
import type { Produit } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

/**
 * Saisie manuelle d'une commande par l'admin.
 *
 * Design volontairement sobre (esprit Klarna) : de grandes cartes beiges à
 * coins très arrondis, aucun cadre superflu, et une seule action noire en
 * pleine largeur en bas.
 *
 * Le total affiché n'est qu'une indication : le serveur recalcule tout
 * (prix produits, tarif de livraison, stock) avec la même fonction que le
 * tunnel client.
 */

type LigneSaisie = { produitId: string; quantite: number };

export default function FormulaireNouvelleCommande({
  produits,
  tarifs,
  parametres,
}: {
  produits: Produit[];
  tarifs: TarifWilaya[];
  parametres: ParametresLivraison;
}) {
  const t = useTranslations("admin.nouvelleCommande");
  const tCmd = useTranslations("commande");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [modeLivraison, setModeLivraison] = useState<ModeLivraison>("domicile");
  const [lignes, setLignes] = useState<LigneSaisie[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [produitEnCause, setProduitEnCause] = useState<string | null>(null);

  // Seules les wilayas desservies sont proposées.
  const codesDesservis = new Set(tarifs.map((x) => x.wilaya));
  const wilayasDisponibles = WILAYAS.filter((w) => codesDesservis.has(w.code));

  const tarifChoisi = tarifs.find((x) => x.wilaya === wilaya);
  const domicileIndispo =
    !!tarifChoisi && !modeDisponible(tarifChoisi, "domicile");
  const modeEffectif: ModeLivraison = domicileIndispo
    ? "stopdesk"
    : modeLivraison;

  const parId = new Map(produits.map((p) => [p.id, p]));
  const sousTotal = lignes.reduce((s, l) => {
    const p = parId.get(l.produitId);
    return s + (p ? p.prix * l.quantite : 0);
  }, 0);
  const livraison = wilaya
    ? calculerLivraison(tarifChoisi, modeEffectif, sousTotal, parametres)
    : null;
  const total = sousTotal + (livraison ?? 0);

  function majLigne(i: number, champ: keyof LigneSaisie, valeur: unknown) {
    setLignes((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [champ]: valeur } : l))
    );
    setErreur(null);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setProduitEnCause(null);
    if (lignes.length === 0 || lignes.some((l) => !l.produitId)) {
      return setErreur("panier_vide");
    }

    setEnvoi(true);
    try {
      const res = await fetch("/api/admin/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: lignes,
          client: { nom, telephone, adresse, wilaya },
          modeLivraison: modeEffectif,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProduitEnCause(data.produitNom ?? null);
        setErreur(data.erreur ?? "erreur_serveur");
        return;
      }
      router.push("/admin/commandes");
      router.refresh();
    } catch {
      setErreur("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  const carte = "rounded-3xl bg-stone-50 p-5 sm:p-6";
  const champ =
    "w-full rounded-xl bg-white px-4 py-2.5 text-[15px] text-gray-900 outline-none transition focus:ring-2 focus:ring-gray-900";
  const label = "mb-1.5 block text-xs font-medium text-gray-700";

  return (
    <section className="mx-auto max-w-2xl pb-8">
      <div className="mb-6">
        <BoutonRetour href="/admin/commandes" />
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {t("nouvelleTitre")}
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-500">
          {t("nouvelleSousTitre")}
        </p>
      </header>

      <form onSubmit={soumettre} className="flex flex-col gap-4">
        {/* ─── Client ──────────────────────────────────────────────── */}
        <div className={carte}>
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">
            {t("sectionClient")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{tCmd("nom")}</span>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className={champ}
              />
            </label>
            <label className="block">
              <span className={label}>{tCmd("telephone")}</span>
              <input
                type="tel"
                inputMode="numeric"
                value={telephone}
                // Même contrainte que le tunnel client : 10 chiffres.
                onChange={(e) =>
                  setTelephone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="0550123456"
                required
                className={champ}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={label}>{tCmd("adresse")}</span>
              <textarea
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                rows={2}
                required
                className={`${champ} resize-y`}
              />
            </label>
          </div>
        </div>

        {/* ─── Articles ────────────────────────────────────────────── */}
        <div className={carte}>
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">
            {t("sectionArticles")}
          </h2>

          {lignes.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {lignes.map((l, i) => {
                const p = parId.get(l.produitId);
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center"
                  >
                    <select
                      value={l.produitId}
                      onChange={(e) => majLigne(i, "produitId", e.target.value)}
                      className="min-w-0 flex-1 rounded-lg bg-stone-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">{t("choisirProduit")}</option>
                      {produits.map((prod) => (
                        <option
                          key={prod.id}
                          value={prod.id}
                          disabled={prod.stock <= 0}
                        >
                          {prod.nom[locale]} — {formatPrix(prod.prix, locale)}
                          {prod.stock <= 0 ? " (0)" : ` (${prod.stock})`}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        // Le maximum suit le stock réel du produit choisi.
                        max={p?.stock ?? undefined}
                        value={l.quantite}
                        onChange={(e) =>
                          majLigne(i, "quantite", Number(e.target.value) || 1)
                        }
                        aria-label={t("quantite")}
                        className="w-20 rounded-lg bg-stone-50 px-3 py-2 text-center text-sm font-semibold tabular-nums text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <span className="ms-auto text-sm font-semibold tabular-nums text-gray-900 sm:ms-0 sm:w-24 sm:text-end">
                        {p ? formatPrix(p.prix * l.quantite, locale) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLignes((prev) => prev.filter((_, x) => x !== i))
                        }
                        aria-label={t("retirer")}
                        title={t("retirer")}
                        className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setLignes((prev) => [...prev, { produitId: "", quantite: 1 }])
            }
            className="inline-flex items-center gap-2 rounded-full border border-gray-900 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-stone-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("ajouterArticle")}
          </button>
        </div>

        {/* ─── Livraison ───────────────────────────────────────────── */}
        <div className={carte}>
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">
            {t("sectionLivraison")}
          </h2>

          <label className="block">
            <span className={label}>{tCmd("wilaya")}</span>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              required
              className={champ}
            >
              <option value="">{tCmd("choisirWilaya")}</option>
              {wilayasDisponibles.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {w.nom[locale]}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(["stopdesk", "domicile"] as ModeLivraison[]).map((m) => {
              const indispo = m === "domicile" && domicileIndispo;
              const prix = tarifChoisi
                ? m === "stopdesk"
                  ? tarifChoisi.prixStopdesk
                  : tarifChoisi.prixDomicile
                : null;
              const Icone = m === "stopdesk" ? Store : Home;
              return (
                <label
                  key={m}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                    indispo
                      ? "cursor-not-allowed border-transparent bg-white/60 opacity-60"
                      : modeEffectif === m
                      ? "cursor-pointer border-gray-900 bg-white"
                      : "cursor-pointer border-transparent bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={modeEffectif === m}
                    disabled={indispo}
                    onChange={() => setModeLivraison(m)}
                    className="accent-gray-900"
                  />
                  <Icone
                    className="h-4 w-4 shrink-0 text-gray-500"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 text-sm text-gray-900">
                    {tCmd(m)}
                  </span>
                  {prix !== null && !indispo && (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                      {formatPrix(prix, locale)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* ─── Total ───────────────────────────────────────────────── */}
        <div className={carte}>
          <Ligne
            libelle={tCmd("sousTotal")}
            valeur={formatPrix(sousTotal, locale)}
          />
          <Ligne
            libelle={tCmd("livraison")}
            valeur={
              livraison === null
                ? tCmd("livraisonSelonWilaya")
                : livraison === 0
                ? tCmd("livraisonGratuite")
                : formatPrix(livraison, locale)
            }
          />
          <div className="my-2 h-px bg-stone-200" />
          <Ligne
            libelle={tCmd("total")}
            valeur={formatPrix(total, locale)}
            enGras
          />
        </div>

        {erreur && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {t.has(`erreurs.${erreur}`)
              ? produitEnCause
                ? t(`erreurs.${erreur}`, { produit: produitEnCause })
                : t(`erreurs.${erreur}`)
              : t("erreurs.erreur_serveur")}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="w-full rounded-full bg-gray-900 py-3.5 text-[15px] font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {envoi ? t("creation") : t("creer")}
        </button>
      </form>
    </section>
  );
}

function Ligne({
  libelle,
  valeur,
  enGras = false,
}: {
  libelle: string;
  valeur: string;
  enGras?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-1 ${
        enGras
          ? "text-base font-semibold text-gray-900"
          : "text-sm text-gray-600"
      }`}
    >
      <span>{libelle}</span>
      <span className="tabular-nums">{valeur}</span>
    </div>
  );
}
