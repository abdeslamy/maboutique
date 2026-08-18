import { Wallet, ShoppingBag, ShoppingCart, Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { getStatistiquesAdmin } from "@/lib/orders";
import { formatPrix } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import Sparkline from "@/components/admin/dashboard/Sparkline";
import DonutStatuts from "@/components/admin/dashboard/DonutStatuts";
import EvolutionCA from "@/components/admin/dashboard/EvolutionCA";
import TauxCles from "@/components/admin/dashboard/TauxCles";
import TopProduits from "@/components/admin/dashboard/TopProduits";

/**
 * Onglet "Dashboard" (/admin).
 * L'en-tête et les onglets sont fournis par le layout parent.
 */
export default async function AdminAccueil({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeTypee = locale as Locale;
  // Déjà appelé par le layout — mis en cache, donc aucune requête DB en plus.
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");
  const tDash = await getTranslations("admin.dashboard");

  const stats = await getStatistiquesAdmin(localeTypee);
  const caParJour = stats.evolution7Jours.map((p) => p.ca);
  const nbParJour = stats.evolution7Jours.map((p) => p.nb);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {t("bonjour", { nom: admin.nom })}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t("intro")}</p>
      </header>

      {/* ─── Row 1 : 4 KPI cards avec sparklines ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          libelle={tDash("kpi.caLivre")}
          valeur={formatPrix(stats.caLivre, localeTypee)}
          sousTitre={tDash("kpi.caLivreSous")}
          enfants={
            <Sparkline valeurs={caParJour} couleur="text-emerald-500" />
          }
        />
        <KpiCard
          icon={ShoppingBag}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          libelle={tDash("kpi.commandes")}
          valeur={String(stats.nbCommandesTotal)}
          sousTitre={tDash("kpi.commandesSous")}
          enfants={<Sparkline valeurs={nbParJour} couleur="text-sky-500" />}
        />
        <KpiCard
          icon={ShoppingCart}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          libelle={tDash("kpi.panierMoyen")}
          valeur={formatPrix(stats.panierMoyen, localeTypee)}
          sousTitre={tDash("kpi.panierMoyenSous")}
        />
        <KpiCard
          icon={Bell}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          libelle={tDash("kpi.enAttente")}
          valeur={String(stats.nbCommandesEnAttente)}
          sousTitre={tDash("kpi.enAttenteSous")}
        />
      </div>

      {/* ─── Row 2 : donut + évolution CA ───────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutStatuts parStatut={stats.commandesParStatut} />
        <EvolutionCA data={stats.evolution7Jours} />
      </div>

      {/* ─── Row 3 : taux clés + top produits ───────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TauxCles
          tauxConfirmationAppel={stats.tauxConfirmationAppel}
          tauxLivraisonReussie={stats.tauxLivraisonReussie}
        />
        <TopProduits produits={stats.topProduits} locale={localeTypee} />
      </div>
    </>
  );
}
