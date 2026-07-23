import {
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Package,
  Bell,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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

export default async function AdminAccueil({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeTypee = locale as Locale;
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");
  const tDash = await getTranslations("admin.dashboard");

  const stats = await getStatistiquesAdmin(localeTypee);
  const caParJour = stats.evolution7Jours.map((p) => p.ca);
  const nbParJour = stats.evolution7Jours.map((p) => p.nb);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t("badge")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
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

      {/* ─── Raccourcis ─────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/produits"
          className="group flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-gray-700 group-hover:text-black">
            <Package className="h-5 w-5" />
            <span className="font-medium">
              {t("actions.produits.titre")}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {t("actions.produits.description")}
          </p>
        </Link>
        <Link
          href="/admin/commandes"
          className="group flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-gray-700 group-hover:text-black">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">
              {t("actions.commandes.titre")}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {t("actions.commandes.description")}
          </p>
        </Link>
      </div>
    </section>
  );
}
