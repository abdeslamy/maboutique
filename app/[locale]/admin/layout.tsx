import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import OngletsAdmin from "@/components/admin/OngletsAdmin";

/**
 * Layout de la section admin.
 *
 * Deux rôles :
 *  1. SÉCURITÉ — vérifie que l'utilisateur est admin AVANT chaque page de
 *     /admin/*. Sinon 404 (ou redirection vers /connexion s'il n'est pas
 *     connecté). Toute page future sous /admin/ est donc protégée d'office.
 *  2. STRUCTURE — fournit l'en-tête + la barre d'onglets communs à toutes
 *     les sections. Les pages n'ont plus qu'à rendre leur contenu.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Bloque tous ceux qui ne sont pas admin. Aucun octet privé n'est envoyé si
  // la vérif échoue (server-side).
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── En-tête + onglets (fond blanc, détaché du contenu) ───────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t("badge")}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
              {t("bonjour", { nom: admin.nom })}
            </h1>
          </div>
          <OngletsAdmin />
        </div>
      </div>

      {/* ─── Contenu de l'onglet actif ───────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
