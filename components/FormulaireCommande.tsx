"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/**
 * Formulaire de passage de commande.
 *  - À gauche : champs (nom, tel, adresse, wilaya).
 *  - À droite : récap des articles + totaux.
 *
 * Au submit : POST /api/commandes avec les ids/quantités du panier + infos client.
 * Le serveur recalcule les prix (jamais ceux du client).
 * En cas de succès : on vide le panier et on navigue vers /confirmation?id=...
 */
export default function FormulaireCommande() {
  const t = useTranslations("commande");
  const tPanier = useTranslations("panier");
  const locale = useLocale() as Locale;

  const { articles, articlesEnrichis, sousTotal, livraison, total, vider, estCharge } = useCart();
  const { utilisateur } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState(utilisateur?.nom ?? "");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [wilaya, setWilaya] = useState("");

  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [erreurTelephone, setErreurTelephone] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // Flag qui indique que la commande vient d'être créée avec succès. Sert à
  // éviter le flash "Panier vide" pendant le laps de temps entre vider()
  // et l'arrivée sur /confirmation.
  const [commandeEnvoyee, setCommandeEnvoyee] = useState(false);

  // Regex téléphone algérien : exactement 10 chiffres, commence par 0.
  const TEL_DZ_REGEX = /^0\d{9}$/;

  function changerTelephone(valeur: string) {
    // On garde uniquement les chiffres et on limite à 10 caractères.
    const nettoye = valeur.replace(/\D/g, "").slice(0, 10);
    setTelephone(nettoye);
    // On efface l'erreur inline si le format devient valide.
    if (erreurTelephone && TEL_DZ_REGEX.test(nettoye)) {
      setErreurTelephone(null);
    }
  }

  // ── Pendant chargement initial du panier ─────────────────────────────
  if (!estCharge) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-center text-gray-500">{tPanier("chargement")}</p>
      </section>
    );
  }

  // ── Commande envoyée : on ne re-montre PAS le panier vide pendant la
  //    navigation vers /confirmation. Petit loader discret à la place.
  if (commandeEnvoyee) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-center text-gray-500">{t("envoi")}</p>
      </section>
    );
  }

  // ── Panier vide : on n'autorise pas la commande ──────────────────────
  if (articles.length === 0) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <p className="text-6xl" aria-hidden="true">🛒</p>
        <h1 className="text-2xl font-semibold">{tPanier("vide")}</h1>
        <p className="text-gray-600">{tPanier("videSousTitre")}</p>
        <Link
          href="/produits"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {tPanier("voirProduits")}
        </Link>
      </section>
    );
  }

  // ── Soumission du formulaire ─────────────────────────────────────────
  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setCleErreur(null);

    // Validation côté client (UX). Le serveur revalide tout.
    if (nom.trim().length < 2) return setCleErreur("nom_court");
    if (!TEL_DZ_REGEX.test(telephone)) {
      setErreurTelephone("telephone_format_dz");
      return;
    }
    if (adresse.trim().length < 5) return setCleErreur("adresse_courte");
    if (!wilaya) return setCleErreur("wilaya_invalide");

    setEnvoi(true);
    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles, // [{ produitId, quantite }]
          client: { nom, telephone, adresse, wilaya },
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCleErreur(data.erreur ?? "erreur_serveur");
        return;
      }

      // Succès : on marque comme "envoyée" AVANT de vider (empêche le flash
      // "Panier vide"), puis on vide et on navigue.
      setCommandeEnvoyee(true);
      vider();
      router.push(`/confirmation?id=${data.commandeId}`);
    } catch {
      setCleErreur("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">{t("titre")}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* ─ Colonne formulaire ─────────────────────────────────────── */}
        <form onSubmit={soumettre} className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("livraison")}
          </h2>

          <Champ label={t("nom")} value={nom} onChange={setNom} autoComplete="name" />

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t("telephone")}</span>
            <input
              type="tel"
              inputMode="numeric"
              value={telephone}
              onChange={(e) => changerTelephone(e.target.value)}
              autoComplete="tel"
              required
              placeholder="0550123456"
              maxLength={10}
              aria-invalid={erreurTelephone ? true : undefined}
              className={`rounded-lg border bg-white px-3 py-2 text-base focus:outline-none ${
                erreurTelephone
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-black"
              }`}
            />
            {erreurTelephone ? (
              <span role="alert" className="text-xs text-red-600">
                {t(`erreurs.${erreurTelephone}`)}
              </span>
            ) : (
              <span className="text-xs text-gray-500">{t("telephoneAide")}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t("wilaya")}</span>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
            >
              <option value="">{t("choisirWilaya")}</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {w.nom[locale]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t("adresse")}</span>
            <textarea
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              autoComplete="street-address"
              required
              rows={3}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
            />
          </label>

          {cleErreur && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {t(`erreurs.${cleErreur}`)}
            </p>
          )}

          <button
            type="submit"
            disabled={envoi}
            className="mt-4 self-start rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {envoi ? t("envoi") : t("commander")}
          </button>
        </form>

        {/* ─ Colonne récapitulatif ──────────────────────────────────── */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("recap")}
          </h2>

          <ul className="mb-4 flex flex-col gap-2">
            {articlesEnrichis.map((a) => (
              <li
                key={a.produitId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-gray-700">
                  {a.produit.nom[locale]} × {a.quantite}
                </span>
                <span className="shrink-0 font-medium text-gray-900">
                  {formatPrix(a.produit.prix * a.quantite, locale)}
                </span>
              </li>
            ))}
          </ul>

          <hr className="my-3 border-gray-200" />

          <Ligne libelle={tPanier("sousTotal")} montant={formatPrix(sousTotal, locale)} />
          <Ligne libelle={tPanier("livraison")} montant={formatPrix(livraison, locale)} />
          <hr className="my-3 border-gray-200" />
          <Ligne libelle={tPanier("total")} montant={formatPrix(total, locale)} enGras />
        </aside>
      </div>
    </section>
  );
}

// ── Petits helpers de présentation ───────────────────────────────────────

function Champ({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "tel" | "email";
  autoComplete?: string;
  aide?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
      />
      {aide && <span className="text-xs text-gray-500">{aide}</span>}
    </label>
  );
}

function Ligne({
  libelle,
  montant,
  enGras = false,
}: {
  libelle: string;
  montant: string;
  enGras?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        enGras ? "text-base font-semibold text-black" : "text-gray-700"
      }`}
    >
      <span>{libelle}</span>
      <span>{montant}</span>
    </div>
  );
}
