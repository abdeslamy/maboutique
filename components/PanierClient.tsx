"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import QuantitySelector from "./QuantitySelector";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/**
 * Affichage du panier :
 *  - Si vide : message + bouton "voir les produits".
 *  - Sinon  : liste des articles + récap (sous-total / livraison / total).
 *
 * Tout est rendu côté client car on lit le Context (qui est lui-même client).
 */
export default function PanierClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations("panier");
  const tProduit = useTranslations("produit");

  const {
    articlesEnrichis,
    modifierQuantite,
    supprimer,
    vider,
    sousTotal,
    livraison,
    total,
    estCharge,
  } = useCart();

  // Pendant le chargement initial depuis localStorage, on évite tout flash.
  if (!estCharge) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-center text-gray-500">{t("chargement")}</p>
      </section>
    );
  }

  // ── État vide ────────────────────────────────────────────────────────
  if (articlesEnrichis.length === 0) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <p className="text-6xl" aria-hidden="true">
          🛒
        </p>
        <h1 className="text-2xl font-semibold">{t("vide")}</h1>
        <p className="text-gray-600">{t("videSousTitre")}</p>
        <Link
          href="/produits"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("voirProduits")}
        </Link>
      </section>
    );
  }

  // ── État rempli ──────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        {t("titre")}
      </h1>

      {/* Liste des articles */}
      <ul className="flex flex-col gap-4">
        {articlesEnrichis.map((a) => {
          const nom = a.produit.nom[locale];
          const prixUnitaire = a.produit.prix;
          const sousTotalLigne = prixUnitaire * a.quantite;

          return (
            <li
              key={a.produitId}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              {/* Vignette */}
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-3xl ${a.produit.images[0]}`}
                aria-hidden="true"
              >
                <span>{a.produit.emoji}</span>
              </div>

              {/* Nom + prix unitaire */}
              <div className="flex-1">
                <Link
                  href={`/produits/${a.produitId}`}
                  className="font-medium text-gray-900 hover:text-black"
                >
                  {nom}
                </Link>
                <p className="text-sm text-gray-500">
                  {formatPrix(prixUnitaire, locale)} / {tProduit("piece")}
                </p>
              </div>

              {/* Sélecteur de quantité */}
              <QuantitySelector
                value={a.quantite}
                onChange={(n) => modifierQuantite(a.produitId, n)}
              />

              {/* Sous-total de la ligne */}
              <p className="w-28 text-end font-semibold text-black">
                {formatPrix(sousTotalLigne, locale)}
              </p>

              {/* Bouton supprimer (rouge, comme demandé) */}
              <button
                type="button"
                onClick={() => supprimer(a.produitId)}
                className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                aria-label={t("supprimer")}
                title={t("supprimer")}
              >
                🗑
              </button>
            </li>
          );
        })}
      </ul>

      {/* Récap */}
      <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <Ligne libelle={t("sousTotal")} montant={formatPrix(sousTotal, locale)} />
        <Ligne libelle={t("livraison")} montant={formatPrix(livraison, locale)} />
        <hr className="my-2 border-gray-200" />
        <Ligne
          libelle={t("total")}
          montant={formatPrix(total, locale)}
          enGras
        />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={vider}
          className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 transition hover:border-red-500 hover:text-red-600"
        >
          {t("viderPanier")}
        </button>
        <Link
          href="/commande"
          className="rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("passerCommande")} →
        </Link>
      </div>
    </section>
  );
}

// Petit composant local pour les lignes du récap (libellé + montant alignés).
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
      className={`flex items-center justify-between ${
        enGras ? "text-lg font-semibold text-black" : "text-gray-700"
      }`}
    >
      <span>{libelle}</span>
      <span>{montant}</span>
    </div>
  );
}
