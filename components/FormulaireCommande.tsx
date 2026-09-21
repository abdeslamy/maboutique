"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrix } from "@/lib/format";
// ⚠️ On importe livraison-calcul (pur) et NON livraison.ts, qui embarque
// Prisma et ne doit jamais atterrir dans le bundle navigateur.
import {
  calculerLivraison,
  modeDisponible,
  panierEnLivraisonOfferte,
  type TarifWilaya,
  type ParametresLivraison,
  type ModeLivraison,
} from "@/lib/livraison-calcul";
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
export default function FormulaireCommande({
  tarifs,
  parametres,
}: {
  tarifs: TarifWilaya[];
  parametres: ParametresLivraison;
}) {
  const t = useTranslations("commande");
  const tPanier = useTranslations("panier");
  const locale = useLocale() as Locale;

  // `livraison` et `total` du panier ne servent plus ici : le prix dépend
  // désormais de la wilaya et du mode, donc on le recalcule sur place.
  const { articles, articlesEnrichis, sousTotal, vider, estCharge } = useCart();
  const { utilisateur } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState(utilisateur?.nom ?? "");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [modeLivraison, setModeLivraison] = useState<ModeLivraison>("domicile");

  // LES 58 WILAYAS sont proposées, y compris celles sans tarif. Une wilaya
  // sans tarif n'est pas une wilaya fermée : c'est une wilaya dont le prix
  // n'est pas encore connu, et cela ne doit jamais empêcher de commander.
  const wilayasDisponibles = WILAYAS;

  // ── Livraison offerte portée par les produits ─────────────────────
  // Elle ne dépend NI de la wilaya NI du mode : on peut donc l'annoncer
  // avant même que le client ait choisi sa destination.
  const offertParLePanier = panierEnLivraisonOfferte(
    articlesEnrichis.map((a) => ({
      livraisonGratuite: a.produit.livraisonGratuite,
    }))
  );
  // Articles qui font perdre la gratuité au reste du panier. On les nomme :
  // « la livraison n'est plus offerte » sans dire pourquoi ressemble à une
  // promesse reprise en douce.
  const sansGratuite = articlesEnrichis.filter(
    (a) => !a.produit.livraisonGratuite
  );
  const gratuitePerdue =
    sansGratuite.length > 0 && sansGratuite.length < articlesEnrichis.length;

  const tarifChoisi = tarifs.find((tr) => tr.wilaya === wilaya);
  // Ce groupe de wilayas n a pas de prix a domicile : seul le retrait au
  // bureau est possible. On bascule le choix sans attendre une action.
  const domicileIndispo =
    !!tarifChoisi && !modeDisponible(tarifChoisi, "domicile");
  const modeEffectif: ModeLivraison = domicileIndispo
    ? "stopdesk"
    : modeLivraison;
  // Même fonction que le serveur → aucun écart possible entre le prix
  // affiché et le prix facturé.
  // Offerte par les produits : le montant est connu (0) SANS attendre la
  // wilaya. C'est tout l'intérêt — le client voit son total définitif tout
  // de suite, au lieu d'un « choisissez une wilaya ».
  const livraison =
    offertParLePanier || wilaya
      ? calculerLivraison(tarifChoisi, modeEffectif, parametres, offertParLePanier)
      : null;
  // Trois situations à ne pas confondre dans l'affichage :
  //   pas encore de wilaya → on invite à en choisir une ;
  //   wilaya sans tarif    → frais annoncés à l'appel, total HORS livraison ;
  //   wilaya tarifée       → montant ferme (0 si la boutique offre).
  const fraisAConfirmer = wilaya !== "" && livraison === null;
  const total = sousTotal + (livraison ?? 0);

  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [erreurTelephone, setErreurTelephone] = useState<string | null>(null);
  // Nom du produit à l'origine d'une erreur de stock (sinon null).
  const [produitEnCause, setProduitEnCause] = useState<string | null>(null);
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
          modeLivraison: modeEffectif,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Les erreurs de stock nomment le produit fautif.
        setProduitEnCause(data.produitNom ?? null);
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
              {wilayasDisponibles.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {w.nom[locale]}
                </option>
              ))}
            </select>
          </label>

          {/* ─── Mode de livraison ──────────────────────────────────
              Les deux prix sont affichés dès qu'une wilaya est choisie :
              le client voit immédiatement ce qu'il économise en stopdesk. */}
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium text-gray-700">
              {t("modeLivraison")}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["domicile", "stopdesk"] as ModeLivraison[]).map((m) => {
                const choisi = modeEffectif === m;
                // Domicile sans prix = la boutique ne livre pas à l'adresse
                // pour cette wilaya : l'option reste visible mais inactive.
                const indisponible = m === "domicile" && domicileIndispo;
                const prix = tarifChoisi
                  ? m === "stopdesk"
                    ? tarifChoisi.prixStopdesk
                    : tarifChoisi.prixDomicile
                  : null;
                return (
                  <label
                    key={m}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                      indisponible
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                        : choisi
                        ? "cursor-pointer border-black bg-gray-50"
                        : "cursor-pointer border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modeLivraison"
                      value={m}
                      checked={choisi}
                      disabled={indisponible}
                      onChange={() => setModeLivraison(m)}
                      className="mt-0.5 accent-black"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={`font-medium ${
                            indisponible ? "text-gray-500" : "text-gray-900"
                          }`}
                        >
                          {t(m)}
                        </span>
                        {/* Chaque mode annonce SON prix. « Offerte » ne vaut
                            donc que pour la gratuité de boutique, ou pour un
                            mode réellement tarifé à 0 — pas parce que l'autre
                            mode, lui, se trouve être gratuit. */}
                        {!indisponible &&
                          (parametres.livraisonGratuite ||
                          offertParLePanier ||
                          prix === 0 ? (
                            <span className="shrink-0 text-sm font-semibold text-gray-900">
                              {t("livraisonGratuite")}
                            </span>
                          ) : fraisAConfirmer ? (
                            // Wilaya sans tarif : aucun des deux modes n'a de
                            // prix. On l'écrit, au lieu de laisser un blanc
                            // qui se lit comme « gratuit ».
                            <span className="shrink-0 text-sm font-medium text-gray-500">
                              {t("aConfirmer")}
                            </span>
                          ) : prix !== null ? (
                            <span className="shrink-0 text-sm font-semibold text-gray-900">
                              {formatPrix(prix, locale)}
                            </span>
                          ) : null)}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {indisponible
                          ? t("modeIndisponible")
                          : t(`${m}Aide`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

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
              {/* Les messages de stock attendent le nom du produit ; les autres
                  n'ont pas de variable. */}
              {produitEnCause
                ? t(`erreurs.${cleErreur}`, { produit: produitEnCause })
                : t(`erreurs.${cleErreur}`)}
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
          <Ligne
            libelle={tPanier("livraison")}
            montant={
              // « Offerte » se teste EN PREMIER : quand la gratuité vient des
              // produits, le montant est connu avant même le choix de la
              // wilaya. L'annoncer après aurait affiché « choisissez une
              // wilaya » pour un prix qu'on connaît déjà.
              livraison === 0
                ? t("livraisonGratuite")
                : !wilaya
                ? t("livraisonSelonWilaya")
                : fraisAConfirmer
                ? t("fraisAlAppel")
                : formatPrix(livraison as number, locale)
            }
          />
          <hr className="my-3 border-gray-200" />
          {/* Le libellé du total CHANGE quand la livraison reste à chiffrer.
              Un « Total » suivi d'un montant incomplet est un engagement
              qu'on ne tiendra pas : on dit explicitement ce qu'il ne
              comprend pas. */}
          <Ligne
            libelle={fraisAConfirmer ? t("totalHorsLivraison") : tPanier("total")}
            montant={formatPrix(total, locale)}
            enGras
          />
          {fraisAConfirmer && (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {t("fraisAlAppelAide")}
            </p>
          )}

          {/* Panier mixte : le client a vu « Livraison gratuite » sur une
              fiche produit, et la livraison lui est pourtant facturée. Sans
              explication, cela ressemble à une promesse reprise en douce —
              on nomme donc les articles qui n'y donnent pas droit. */}
          {gratuitePerdue && (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {t("gratuitePerdue", {
                produits: sansGratuite
                  .map((a) => a.produit.nom[locale])
                  .join(", "),
              })}
            </p>
          )}
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
