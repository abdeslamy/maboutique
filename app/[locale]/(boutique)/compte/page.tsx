import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getCommandesParUtilisateurId } from "@/lib/orders";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import TimelineCommande from "@/components/TimelineCommande";

/**
 * Page /compte — protégée.
 * Affiche les infos du compte + l'historique des commandes (lecture directe
 * du fichier data/commandes.json, filtré par email).
 */
export default async function PageCompte({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeTypee = locale as Locale;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/connexion`);
  }

  const t = await getTranslations("compte");

  // Lecture des commandes de l'utilisateur (lecture serveur directe — pas
  // besoin de passer par fetch puisqu'on a déjà accès au système de fichiers).
  const commandes = await getCommandesParUtilisateurId(session.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className="mt-2 text-gray-600">
          {t("bonjour", { nom: session.nom })}
        </p>
      </header>

      {/* Bloc infos compte */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("informations")}
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">{t("nom")}</dt>
            <dd className="font-medium text-gray-900">{session.nom}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t("email")}</dt>
            <dd className="font-medium text-gray-900">{session.email}</dd>
          </div>
        </dl>
      </div>

      {/* Bloc historique commandes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("mesCommandes")}
        </h2>

        {commandes.length === 0 ? (
          <p className="text-gray-500">{t("aucuneCommande")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {commandes.map((c) => {
              const date = new Date(c.date);
              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  {/* Ligne du haut : date/articles + total + CTA */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">
                        {date.toLocaleDateString(
                          localeTypee === "ar" ? "ar-DZ" : "fr-DZ",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        {" · "}
                        {c.articles.reduce((s, a) => s + a.quantite, 0)}{" "}
                        {t("articles")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-black">
                        {formatPrix(c.total, localeTypee)}
                      </span>
                      <Link
                        href={{ pathname: "/confirmation", query: { id: c.id } }}
                        className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 transition hover:border-black hover:text-black"
                      >
                        {t("voirDetail")}
                      </Link>
                    </div>
                  </div>
                  {/* Timeline compacte (synchronisée avec l'admin) */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <TimelineCommande commande={c} mode="compact" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
