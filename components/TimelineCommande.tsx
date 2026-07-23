"use client";

import { Check, PhoneCall, Package, Truck, Ban } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Commande, StatutCommande } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

/**
 * Timeline de suivi d'une commande — synchronisée avec les changements admin.
 *
 * Deux modes :
 *  - "complete" (défaut) : version verticale détaillée, utilisée sur /confirmation
 *  - "compact" : version horizontale compacte, utilisée dans /compte
 *
 * États d'étape :
 *  - passee : ✓ vert (avec date)
 *  - en_cours : icône pulsée (couleur active)
 *  - future : grisée
 *  - annulee : rouge (Ban)
 *
 * Cas spécial "annulee" : on affiche uniquement 2 étapes (Commande passée →
 * Annulée), avec les étapes non atteintes grisées.
 */

type EtapeKey = "creee" | "confirmee" | "en_livraison" | "livree";
type EtatEtape = "passee" | "en_cours" | "future" | "annulee";

type Etape = {
  key: EtapeKey;
  Icon: typeof Check;
  etat: EtatEtape;
  date?: string;
};

function calculerEtapes(commande: Commande): Etape[] {
  const s = commande.statut;

  // Cas commande annulée : la 1ère étape est acquise, ensuite bascule en annulée
  if (s === "annulee") {
    return [
      { key: "creee", Icon: Check, etat: "passee", date: commande.date },
      {
        key: "confirmee",
        Icon: Ban,
        etat: "annulee",
        date: commande.annuleeAt,
      },
      { key: "en_livraison", Icon: Truck, etat: "future" },
      { key: "livree", Icon: Package, etat: "future" },
    ];
  }

  // Cas nominal : 4 étapes
  // Étape en cours = celle qui suit le dernier statut atteint
  const etatDe = (k: EtapeKey): EtatEtape => {
    switch (k) {
      case "creee":
        // Toujours passée dès qu'il y a une commande
        return "passee";
      case "confirmee":
        if (s === "en_attente") return "en_cours";
        return "passee"; // confirmee, en_livraison, livree
      case "en_livraison":
        if (s === "en_attente") return "future";
        if (s === "confirmee") return "en_cours";
        return "passee"; // en_livraison, livree
      case "livree":
        if (s === "livree") return "passee";
        if (s === "en_livraison") return "en_cours";
        return "future";
    }
  };

  return [
    {
      key: "creee",
      Icon: Check,
      etat: etatDe("creee"),
      date: commande.date,
    },
    {
      key: "confirmee",
      Icon: PhoneCall,
      etat: etatDe("confirmee"),
      date: commande.confirmedAt,
    },
    {
      key: "en_livraison",
      Icon: Package,
      etat: etatDe("en_livraison"),
      date: commande.enLivraisonAt,
    },
    {
      key: "livree",
      Icon: Truck,
      etat: etatDe("livree"),
      date: commande.livreeAt,
    },
  ];
}

function formatDateHeure(iso: string | undefined, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(
    locale === "ar" ? "ar-DZ" : "fr-DZ",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

// ────────────────────────────────────────────────────────────────────────
// MODE COMPLET (page /confirmation) — vertical, avec titre + description
// ────────────────────────────────────────────────────────────────────────

export default function TimelineCommande({
  commande,
  mode = "complete",
}: {
  commande: Commande;
  mode?: "complete" | "compact";
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("timeline");
  const etapes = calculerEtapes(commande);

  if (mode === "compact") {
    return <TimelineCompacte commande={commande} etapes={etapes} locale={locale} t={t} />;
  }

  return (
    <ol className="flex flex-col gap-5">
      {etapes.map((etape, i) => {
        const derniere = i === etapes.length - 1;
        const titre = t(`etapes.${etape.key}.titre`);
        const description = t(`etapes.${etape.key}.description`);
        return (
          <li key={etape.key} className="relative flex gap-4">
            {/* Ligne verticale entre les pastilles */}
            {!derniere && (
              <span
                className={`absolute start-4 top-9 h-[calc(100%-4px)] w-px ${
                  etape.etat === "passee" ? "bg-green-300" : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            )}

            {/* Pastille icône */}
            <PastilleEtape etat={etape.etat} Icon={etape.Icon} />

            {/* Texte */}
            <div className="pt-0.5">
              <p
                className={`text-sm font-medium ${
                  etape.etat === "future"
                    ? "text-gray-400"
                    : etape.etat === "annulee"
                    ? "text-red-700"
                    : "text-gray-900"
                }`}
              >
                {etape.etat === "annulee" ? t("commandeAnnulee") : titre}
              </p>
              <p
                className={`mt-0.5 text-sm ${
                  etape.etat === "future" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {etape.etat === "annulee"
                  ? t("commandeAnnuleeDescription")
                  : description}
              </p>
              {etape.date && (
                <p
                  className={`mt-1 text-xs ${
                    etape.etat === "annulee"
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {formatDateHeure(etape.date, locale)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Pastille visuelle d'une étape (utilisée en mode complet) ─────────

function PastilleEtape({
  etat,
  Icon,
}: {
  etat: EtatEtape;
  Icon: typeof Check;
}) {
  const base =
    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full";

  if (etat === "passee") {
    return (
      <span className={`${base} bg-green-500 text-white`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  if (etat === "en_cours") {
    return (
      <span className={`${base} bg-sky-500 text-white`}>
        {/* Halo pulsé */}
        <span className="absolute inset-0 rounded-full bg-sky-400 opacity-60 animate-ping" />
        <Icon className="relative h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  if (etat === "annulee") {
    return (
      <span className={`${base} bg-red-500 text-white`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  // future
  return (
    <span className={`${base} border border-gray-300 bg-white text-gray-400`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MODE COMPACT (cartes /compte) — horizontal, minimaliste
// ────────────────────────────────────────────────────────────────────────

function TimelineCompacte({
  commande,
  etapes,
  locale,
  t,
}: {
  commande: Commande;
  etapes: Etape[];
  locale: Locale;
  t: ReturnType<typeof useTranslations<"timeline">>;
}) {
  // Trouve l'étape en cours (ou la dernière passée si tout est fait)
  const idxEnCours = etapes.findIndex((e) => e.etat === "en_cours");
  const idxAnnulee = etapes.findIndex((e) => e.etat === "annulee");
  const derniereAtteinte =
    idxAnnulee !== -1
      ? idxAnnulee
      : idxEnCours !== -1
      ? idxEnCours
      : etapes.filter((e) => e.etat === "passee").length - 1;

  const etapeActive =
    idxAnnulee !== -1
      ? etapes[idxAnnulee]
      : idxEnCours !== -1
      ? etapes[idxEnCours]
      : etapes[etapes.length - 1];

  return (
    <div className="flex flex-col gap-2">
      {/* Barre horizontale de 4 pastilles */}
      <div className="flex items-center gap-1">
        {etapes.map((etape, i) => {
          const derniere = i === etapes.length - 1;
          const pastilleColor =
            etape.etat === "passee"
              ? "bg-green-500"
              : etape.etat === "en_cours"
              ? "bg-sky-500"
              : etape.etat === "annulee"
              ? "bg-red-500"
              : "bg-gray-200";
          const traitColor =
            i < derniereAtteinte && idxAnnulee === -1
              ? "bg-green-400"
              : "bg-gray-200";
          return (
            <div key={etape.key} className="flex flex-1 items-center gap-1">
              <span
                className={`relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full ${pastilleColor}`}
                aria-hidden="true"
              >
                {etape.etat === "en_cours" && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-60" />
                )}
              </span>
              {!derniere && (
                <span className={`h-0.5 flex-1 rounded ${traitColor}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Texte de l'étape active */}
      <p className="text-xs text-gray-600">
        {etapeActive.etat === "annulee" ? (
          <span className="font-medium text-red-600">
            {t("commandeAnnulee")}
          </span>
        ) : (
          <>
            <span className="font-medium text-gray-900">
              {t(`etapes.${etapeActive.key}.titre`)}
            </span>
            {etapeActive.date && (
              <span className="text-gray-500">
                {" · "}
                {formatDateHeure(etapeActive.date, locale)}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
