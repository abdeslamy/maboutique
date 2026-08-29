import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import FormulaireConnexionMarchand from "@/components/admin/FormulaireConnexionMarchand";

/**
 * /admin/connexion — porte d'entrée des marchands.
 *
 * ⚠️ Cette page est le SEUL segment de /admin qui ne soit pas protégé, et
 * c'est délibéré : le layout de (espace) appelle requireAdmin(), qui redirige
 * ici quand personne n'est connecté. Si la page vivait sous ce layout, elle se
 * redirigerait vers elle-même sans fin. D'où le groupe (espace) : il porte le
 * garde et la barre latérale sans toucher à l'URL, et connexion/ reste
 * dehors.
 *
 * Ce fichier n'appelle donc PAS requireAdmin. Il ne divulgue rien : le
 * formulaire est le même que n'importe quel écran d'identification.
 */

export const metadata: Metadata = {
  // Rien à gagner à voir un écran d'identification dans les résultats de
  // recherche — et l'y laisser expose la surface d'attaque au tout-venant.
  robots: { index: false, follow: false },
};

export default async function PageConnexionMarchand({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Marchand déjà identifié : inutile de lui redemander. On saute au tableau
  // de bord. Le rôle est relu en base, jamais pris dans le JWT.
  const session = await getSession();
  if (session) {
    const utilisateur = await getUtilisateurParId(session.id);
    if (utilisateur?.role === "admin") {
      redirect(`/${locale}/admin`);
    }
    // Session de client : on le laisse voir le formulaire. Le composant lui
    // expliquera, s'il insiste, que ce n'est pas sa porte.
  }

  return <FormulaireConnexionMarchand />;
}
