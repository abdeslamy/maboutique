import Navbar from "@/components/Navbar";
import NavigationMobile from "@/components/mobile/NavigationMobile";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/categories";
import { RechercheProvider } from "@/context/RechercheContext";
import ContenuPage from "@/components/recherche/ContenuPage";
import type { Locale } from "@/i18n/routing";

/**
 * Habillage de la BOUTIQUE : barre de navigation, pied de page, tab bar
 * mobile, recherche.
 *
 * Tout cela vivait dans le layout racine, donc s'appliquait aussi à /admin —
 * un marchand voyait la barre client et le pied de page de la vitrine
 * par-dessus son espace de gestion. Le groupe (boutique) le remet à sa place :
 * les parenthèses n'apparaissent pas dans les URL, seul l'habillage descend.
 *
 * Ça va dans le sens de la règle des origines (voir docs/multi-boutiques.md
 * §2 bis) : l'administration partira un jour sur son propre domaine, où cet
 * habillage n'aurait de toute façon aucun sens.
 *
 * Effet secondaire appréciable : les rayons ne sont plus chargés que pour les
 * pages qui peuvent les afficher. L'admin ne les demande plus.
 */
export default async function BoutiqueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Rayons de la boutique — l'overlay de recherche en a besoin sur toutes les
  // pages de la vitrine, pas seulement sur le catalogue.
  const categories = await getCategories();

  return (
    // RechercheProvider rend l'overlay APRÈS le contenu de page, et donc hors
    // de l'enveloppe qui recule pendant qu'il est ouvert. Les rayons lui sont
    // passés ici : un composant client ne peut pas interroger Prisma.
    <RechercheProvider categories={categories}>
      <ContenuPage>
        {/* Navigation DESKTOP : masquée sous 640 px, où la navigation mobile
            flottante prend le relais. */}
        <div className="hidden sm:block">
          <Navbar locale={locale as Locale} />
        </div>

        {/* Navigation MOBILE : deux barres flottantes, sous 640 px. Le padding
            compense leur position fixe pour que le contenu ne passe jamais
            dessous — haut : 132 px = status bar 52 + titre/boutons + 16.
            La réserve du BAS est portée par le pied de page, qui suit <main> :
            c'est lui qui touche le bas du document, donc lui que la tab bar
            flottante recouvrirait. */}
        <main
          id="contenu-principal"
          // Classes Tailwind plutôt qu'un style inline : le padding doit
          // disparaître à partir de sm, et un style inline ne peut pas être
          // conditionné par une media query.
          className="flex-1 pt-[132px] sm:pt-0"
        >
          {children}
        </main>
        <Footer />
      </ContenuPage>

      {/* Hors de l'enveloppe : les barres flottantes sont en position fixed et
          doivent le rester par rapport au viewport, pas par rapport au
          conteneur transformé. */}
      <NavigationMobile />
    </RechercheProvider>
  );
}
