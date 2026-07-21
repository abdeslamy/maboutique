import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import FormulaireParametres from "@/components/FormulaireParametres";

/**
 * Page /compte/parametres — protégée.
 * Le contenu (formulaires) est dans un composant client qui appelle l'API.
 */
export default async function PageParametres({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/connexion`);
  }
  return <FormulaireParametres />;
}
