import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCommandeParId } from "@/lib/orders";
import { formatPrix } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import type { Locale } from "@/i18n/routing";

/**
 * Page /confirmation?id=XXX
 * Composant SERVEUR : lit directement la commande depuis le fichier.
 *
 * Pourquoi l'id est dans l'URL ?
 *  - Permet à l'utilisateur de revenir sur la page (bookmark, partage, etc.).
 *  - L'id est un UUID v4, donc "non devinable" en pratique.
 *
 * Si l'id n'est pas trouvé → on affiche un message générique de succès.
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      {/* Bandeau succès vert */}
      <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl bg-green-50 px-6 py-10 text-center">
        <p className="text-6xl" aria-hidden="true">
          ✅
        </p>
        <h1 className="text-3xl font-semibold text-green-800">{t("titre")}</h1>
        <p className="text-green-700">{t("message")}</p>
      </div>

      {commande ? (
        <>
          {/* Numéro de commande */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("numero")}
            </p>
            <p className="mt-1 break-all font-mono text-sm text-gray-900">
              {commande.id}
            </p>
          </div>

          {/* Récap articles */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              {tCommande("recap")}
            </h2>
            <ul className="flex flex-col gap-2">
              {commande.articles.map((a) => (
                <li
                  key={a.produitId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {a.nom} × {a.quantite}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrix(a.prixUnitaire * a.quantite, localeTypee)}
                  </span>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-gray-200" />
            <Ligne
              libelle={tPanier("sousTotal")}
              montant={formatPrix(commande.sousTotal, localeTypee)}
            />
            <Ligne
              libelle={tPanier("livraison")}
              montant={formatPrix(commande.livraison, localeTypee)}
            />
            <hr className="my-3 border-gray-200" />
            <Ligne
              libelle={tPanier("total")}
              montant={formatPrix(commande.total, localeTypee)}
              enGras
            />
          </div>

          {/* Adresse de livraison */}
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              {tCommande("livraison")}
            </h2>
            <p className="text-gray-900">{commande.client.nom}</p>
            <p className="text-gray-700">{commande.client.telephone}</p>
            <p className="text-gray-700">{commande.client.adresse}</p>
            <p className="text-gray-700">
              {WILAYAS.find((w) => w.code === commande.client.wilaya)?.nom[
                localeTypee
              ] ?? commande.client.wilaya}
            </p>
          </div>
        </>
      ) : (
        <p className="mb-8 text-center text-gray-600">
          {t("commandeIntrouvable")}
        </p>
      )}

      <div className="flex justify-center gap-4">
        <Link
          href="/"
          className="rounded-full border border-gray-300 px-6 py-3 text-sm text-gray-700 transition hover:border-black hover:text-black"
        >
          {t("retourAccueil")}
        </Link>
        <Link
          href="/produits"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("continuerShopping")}
        </Link>
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
