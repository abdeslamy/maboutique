import { requireAdmin } from "@/lib/admin";

/**
 * Layout de la section admin.
 *
 * Ce layout s'exécute AVANT chaque page de /admin/*. Il vérifie que
 * l'utilisateur est admin. Sinon, l'utilisateur voit une 404
 * (ou est redirigé vers /connexion s'il n'est pas connecté du tout).
 *
 * Résultat : toute page future ajoutée sous /admin/ est automatiquement
 * protégée, sans avoir à re-écrire la garde à chaque fois.
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
  await requireAdmin(locale);

  return <>{children}</>;
}
