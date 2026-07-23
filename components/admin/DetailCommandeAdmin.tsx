"use client";

import { useState } from "react";
import { Phone, MapPin, User, Check, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPrix } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import { ETATS_APPEL } from "@/lib/types";
import type { Commande, EtatAppel, StatutCommande } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import BoutonRetour from "@/components/BoutonRetour";
import PastilleStatut from "./PastilleStatut";

const STATUTS: StatutCommande[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

/**
 * Détail d'une commande côté admin :
 *  - Infos client (téléphone cliquable)
 *  - Articles + totaux
 *  - Section "Gestion" : statut LIBRE, état d'appel, notes → 1 bouton Enregistrer
 */
export default function DetailCommandeAdmin({
  commande: commandeInitiale,
}: {
  commande: Commande;
}) {
  const t = useTranslations("admin.commandes");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [commande, setCommande] = useState<Commande>(commandeInitiale);

  // États du formulaire de gestion
  const [statut, setStatut] = useState<StatutCommande>(commandeInitiale.statut);
  const [etatAppel, setEtatAppel] = useState<EtatAppel>(
    commandeInitiale.etatAppel ?? "non_appele"
  );
  const [notes, setNotes] = useState(commandeInitiale.notes ?? "");

  const [enregistrement, setEnregistrement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const wilaya = WILAYAS.find((w) => w.code === commande.client.wilaya);

  // Y a-t-il des changements non enregistrés ?
  const modifie =
    statut !== commande.statut ||
    etatAppel !== (commande.etatAppel ?? "non_appele") ||
    notes !== (commande.notes ?? "");

  async function enregistrer() {
    setEnregistrement(true);
    setErreur(null);
    setSucces(false);
    try {
      const res = await fetch(`/api/admin/commandes/${commande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, etatAppel, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "erreur_serveur");
        return;
      }
      setCommande(data.commande);
      setSucces(true);
      router.refresh();
    } catch {
      setErreur("erreur_serveur");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <BoutonRetour href="/admin/commandes" />
      </div>

      {/* En-tête */}
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-gray-500">#{commande.id}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("commande")} — {commande.client.nom}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {new Date(commande.date).toLocaleDateString(
              locale === "ar" ? "ar-DZ" : "fr-DZ",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>
        <PastilleStatut statut={commande.statut} taille="md" />
      </header>

      {/* ─── Section Gestion (statut + état d'appel + notes) ──────────── */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("gestion")}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Statut logistique */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t("statut")}</span>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as StatutCommande)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {t(`statuts.${s}`)}
                </option>
              ))}
            </select>
          </label>

          {/* État d'appel */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t("etatAppel")}</span>
            <select
              value={etatAppel}
              onChange={(e) => setEtatAppel(e.target.value as EtatAppel)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
            >
              {ETATS_APPEL.map((e) => (
                <option key={e} value={e}>
                  {t(`etatsAppel.${e}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Notes */}
        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("notes")}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("notesPlaceholder")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
          />
        </label>

        {/* Feedback */}
        {succes && (
          <p
            role="status"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700"
          >
            <Check className="h-4 w-4" />
            {t("enregistre")}
          </p>
        )}
        {erreur && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {t.has(`erreurs.${erreur}`)
              ? t(`erreurs.${erreur}`)
              : t("erreurs.erreur_serveur")}
          </p>
        )}

        {/* Bouton enregistrer */}
        <div className="mt-5">
          <button
            type="button"
            onClick={enregistrer}
            disabled={enregistrement || !modifie}
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {enregistrement ? t("enregistrement") : t("enregistrer")}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("client")}
          </h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <dt className="text-xs text-gray-500">{t("nom")}</dt>
                <dd className="font-medium text-gray-900">
                  {commande.client.nom}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <dt className="text-xs text-gray-500">{t("telephone")}</dt>
                <dd>
                  <a
                    href={`tel:${commande.client.telephone}`}
                    className="font-medium text-black underline"
                  >
                    {commande.client.telephone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <dt className="text-xs text-gray-500">{t("adresse")}</dt>
                <dd className="text-gray-900">{commande.client.adresse}</dd>
                <dd className="text-sm text-gray-600">
                  {wilaya?.code} — {wilaya?.nom[locale] ?? commande.client.wilaya}
                </dd>
              </div>
            </div>
          </dl>
        </aside>

        {/* Articles + totaux */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("articles")}
          </h2>
          <ul className="flex flex-col gap-2">
            {commande.articles.map((a, i) => (
              <li
                key={`${a.produitId}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {a.nom} × {a.quantite}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrix(a.prixUnitaire * a.quantite, locale)}
                </span>
              </li>
            ))}
          </ul>
          <hr className="my-4 border-gray-200" />
          <Ligne
            libelle={t("sousTotal")}
            montant={formatPrix(commande.sousTotal, locale)}
          />
          <Ligne
            libelle={t("livraison")}
            montant={formatPrix(commande.livraison, locale)}
          />
          <hr className="my-3 border-gray-200" />
          <Ligne
            libelle={t("total")}
            montant={formatPrix(commande.total, locale)}
            enGras
          />
        </div>
      </div>
    </section>
  );
}

function Ligne({
  libelle,
  montant,
  enGras,
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
