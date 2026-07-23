import { getTranslations } from "next-intl/server";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCommandeParId } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { formatPrix } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import type { Locale } from "@/i18n/routing";
import TimelineCommande from "@/components/TimelineCommande";

/**
 * Page /confirmation?id=XXX
 * Composant SERVEUR : lit directement la commande depuis la base.
 * Design refait : hero animé, timeline "prochaines étapes", récap épuré.
 */
export default async function PageConfirmation({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const localeTypee = locale as Locale;
  const { id } = await searchParams;

  const t = await getTranslations("confirmation");
  const tPanier = await getTranslations("panier");
  const tCommande = await getTranslations("commande");

  const commande = id ? await getCommandeParId(id) : null;
  const session = await getSession();
  const wilaya = commande
    ? WILAYAS.find((w) => w.code === commande.client.wilaya)
    : undefined;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {/* ─── Hero succès animé ──────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          {/* Halo qui s'étend */}
          <span className="confirm-halo absolute inset-0 rounded-full bg-green-400" />
          {/* Cercle vert */}
          <span className="confirm-cercle relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
            {/* Checkmark SVG qui se dessine */}
            <svg
              viewBox="0 0 52 52"
              className="h-12 w-12"
              fill="none"
              aria-hidden="true"
            >
              <path
                className="confirm-check"
                d="M14 27 l8 8 l16 -18"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <h1 className="confirm-apparition text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          {t("titre")}
        </h1>
        <p
          className="confirm-apparition mt-3 max-w-md text-gray-600"
          style={{ animationDelay: "0.1s" }}
        >
          {t("message")}
        </p>

        {/* Numéro de commande en pastille */}
        {commande && (
          <div
            className="confirm-apparition mt-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {t("numero")}
            </span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              #{commande.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {commande ? (
        <div
          className="confirm-apparition mt-10 flex flex-col gap-4"
          style={{ animationDelay: "0.2s" }}
        >
          {/* ─── Timeline de suivi (synchronisée avec l'admin) ─────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-sm font-medium uppercase tracking-wide text-gray-500">
              {t("prochainesEtapes")}
            </h2>
            <TimelineCommande commande={commande} mode="complete" />
          </div>

          {/* ─── Récap articles + totaux ────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              {tCommande("recap")}
            </h2>
            <ul className="flex flex-col gap-2">
              {commande.articles.map((a, i) => (
                <li
                  key={`${a.produitId}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {a.nom} <span className="text-gray-400">× {a.quantite}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrix(a.prixUnitaire * a.quantite, localeTypee)}
                  </span>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-gray-100" />
            <Ligne
              libelle={tPanier("sousTotal")}
              montant={formatPrix(commande.sousTotal, localeTypee)}
            />
            <Ligne
              libelle={tPanier("livraison")}
              montant={formatPrix(commande.livraison, localeTypee)}
            />
            <hr className="my-3 border-gray-100" />
            <Ligne
              libelle={tPanier("total")}
              montant={formatPrix(commande.total, localeTypee)}
              enGras
            />
          </div>

          {/* ─── Livraison ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-500">
              <MapPin className="h-4 w-4" />
              {tCommande("livraison")}
            </h2>
            <p className="font-medium text-gray-900">{commande.client.nom}</p>
            <p className="text-sm text-gray-600">{commande.client.telephone}</p>
            <p className="mt-1 text-sm text-gray-600">
              {commande.client.adresse}
            </p>
            <p className="text-sm text-gray-600">
              {wilaya ? `${wilaya.code} — ${wilaya.nom[localeTypee]}` : commande.client.wilaya}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-10 text-center text-gray-600">
          {t("commandeIntrouvable")}
        </p>
      )}

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/produits"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("continuerShopping")}
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
        </Link>
        {session && (
          <Link
            href="/compte"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
          >
            {t("suivreCommande")}
          </Link>
        )}
      </div>
    </section>
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
