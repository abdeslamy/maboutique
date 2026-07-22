import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Package, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * Page d'accueil de l'admin — dashboard synthétique :
 * quelques indicateurs, deux points d'entrée (Produits / Commandes).
 * L'interface Produits et Commandes seront ajoutées aux briques 2 et 3.
 */
export default async function AdminAccueil({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");

  // Petits chiffres pour la vitrine du dashboard.
  const [nbProduits, nbCommandes, nbCommandesEnAttente] = await Promise.all([
    prisma.produit.count(),
    prisma.commande.count(),
    prisma.commande.count({ where: { statut: "en_attente" } }),
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          {t("badge")}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {t("bonjour", { nom: admin.nom })}
        </h1>
        <p className="mt-2 text-gray-600">{t("intro")}</p>
      </header>

      {/* Indicateurs */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi libelle={t("kpi.produits")} valeur={nbProduits} />
        <Kpi libelle={t("kpi.commandes")} valeur={nbCommandes} />
        <Kpi
          libelle={t("kpi.commandesEnAttente")}
          valeur={nbCommandesEnAttente}
          accent="amber"
        />
      </div>

      {/* Points d'entrée */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CarteAction
          href="/admin/produits"
          icon={<Package className="h-5 w-5" />}
          titre={t("actions.produits.titre")}
          description={t("actions.produits.description")}
        />
        <CarteAction
          href="/admin/commandes"
          icon={<ShoppingBag className="h-5 w-5" />}
          titre={t("actions.commandes.titre")}
          description={t("actions.commandes.description")}
        />
      </div>
    </section>
  );
}

function Kpi({
  libelle,
  valeur,
  accent,
}: {
  libelle: string;
  valeur: number;
  accent?: "amber";
}) {
  const accentColor =
    accent === "amber" ? "text-amber-600" : "text-gray-900";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className={`mt-2 text-3xl font-semibold ${accentColor}`}>{valeur}</p>
    </div>
  );
}

function CarteAction({
  href,
  icon,
  titre,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  titre: string;
  description: string;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={href as any}
      className="group flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-gray-700 group-hover:text-black">
        {icon}
        <span className="font-medium">{titre}</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
