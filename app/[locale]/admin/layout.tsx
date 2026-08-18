import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import SidebarAdmin from "@/components/admin/SidebarAdmin";

/**
 * Layout de la section admin.
 *
 * Deux rôles :
 *  1. SÉCURITÉ — vérifie que l'utilisateur est admin AVANT chaque page de
 *     /admin/*. Sinon 404 (ou redirection vers /connexion s'il n'est pas
 *     connecté). Toute page future sous /admin/ est donc protégée d'office.
 *  2. STRUCTURE — affiche le menu latéral commun à toutes les sections.
 *
 * L'état réduit/ouvert de la sidebar est lu ICI, côté serveur, depuis un
 * cookie. C'est ce qui évite le "saut" visuel qu'on aurait avec localStorage
 * (rendu ouvert, puis repli brutal après hydratation).
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

  const cookieStore = await cookies();
  const reduitInitial = cookieStore.get("admin_sidebar")?.value === "reduite";

  return (
    // Mobile : empilement (barre du menu au-dessus du contenu).
    // Desktop (sm+) : deux colonnes, sidebar à gauche.
    <div className="sm:flex sm:items-start">
      <SidebarAdmin
        reduitInitial={reduitInitial}
        nom={admin.nom}
        image={admin.image}
      />

      {/* min-w-0 : autorise le contenu à rétrécir au lieu de déborder
          (sans ça, un tableau large pousserait toute la page). */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
