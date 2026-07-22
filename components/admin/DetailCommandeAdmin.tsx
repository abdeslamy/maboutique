"use client";

import { useState } from "react";
import { Phone, MapPin, User, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPrix } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import type { Commande, StatutCommande } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import BoutonRetour from "@/components/BoutonRetour";
import PastilleStatut from "./PastilleStatut";

/**
 * Détail d'une commande côté admin :
 *  - Infos client (avec téléphone cliquable pour appeler)
 *  - Articles avec snapshot des prix
 *  - Totaux
 *  - Zone de changement de statut (boutons pour les transitions autorisées)
 */
export default function DetailCommandeAdmin({
  commande: commandeInitiale,
  transitionsAutorisees: transitionsInitiales,
}: {
  commande: Commande;
  transitionsAutorisees: StatutCommande[];
}) {
  const t = useTranslations("admin.commandes");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [commande, setCommande] = useState<Commande>(commandeInitiale);
  const [transitions, setTransitions] =
    useState<StatutCommande[]>(transitionsInitiales);
  const [enChangement, setEnChangement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const wilaya = WILAYAS.find((w) => w.code === commande.client.wilaya);

  async function changerStatut(nouveau: StatutCommande) {
    setEnChangement(true);
    setErreur(null);
    setSucces(false);
    try {
      const res = await fetch(
        `/api/admin/commandes/${commande.id}/statut`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: nouveau }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "erreur_serveur");
        return;
      }
      setCommande(data.commande);
      // Recalcule les transitions autorisées côté client
      setTransitions(calculerTransitions(data.commande.statut));
      setSucces(true);
      // Rafraîchit aussi la page côté serveur (pour d'éventuels autres composants)
      router.refresh();
    } catch {
      setErreur("erreur_serveur");
    } finally {
      setEnChangement(false);
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

      {/* Feedback */}
      {succes && (
        <p
          role="status"
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700"
        >
          <Check className="h-4 w-4" />
          {t("statutMisAJour")}
        </p>
      )}
      {erreur && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {t.has(`erreurs.${erreur}`)
            ? t(`erreurs.${erreur}`)
            : t("erreurs.erreur_serveur")}
        </p>
      )}

      {/* Actions de statut */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("changerStatut")}
        </h2>
        {transitions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("statutFinal")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changerStatut(s)}
                disabled={enChangement}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                  s === "annulee"
                    ? "border-red-300 text-red-700 hover:bg-red-50"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {t(`actions.${s}`)}
              </button>
            ))}
          </div>
        )}
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

// Duplication locale de la machine à états (client-side)
// Pour éviter d'importer lib/orders qui utilise Prisma.
function calculerTransitions(actuel: StatutCommande): StatutCommande[] {
  const T: Record<StatutCommande, StatutCommande[]> = {
    en_attente: ["confirmee", "annulee"],
    confirmee: ["en_livraison", "annulee"],
    en_livraison: ["livree", "annulee"],
    livree: [],
    annulee: [],
  };
  return T[actuel] ?? [];
}
