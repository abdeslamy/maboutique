import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import NavigationMobile from "@/components/mobile/NavigationMobile";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { RechercheProvider } from "@/context/RechercheContext";
import ContenuPage from "@/components/recherche/ContenuPage";
import "../globals.css";

// ──────────────────────────────────────────────────────────────────────────
// Polices : next/font charge les polices Google au moment du build, les
// héberge localement (pas de requête vers Google en production) et expose
// une variable CSS qu'on injecte sur <html>.
// ──────────────────────────────────────────────────────────────────────────

const fontLatin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-latin", // utilisable dans globals.css
  display: "swap",
});

const fontArabic = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

// ──────────────────────────────────────────────────────────────────────────
// Métadonnées dynamiques selon la locale (titre d'onglet, description SEO).
// ──────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("titreSite"),
    description: t("description"),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// generateStaticParams indique à Next.js quelles valeurs de [locale]
// générer statiquement au build. Ici : "fr" et "ar".
// ──────────────────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ──────────────────────────────────────────────────────────────────────────
// Le layout racine. Reçoit la locale via params (segment dynamique [locale]).
// Dans Next.js 15+, params est une Promise → on l'attend (await).
// ──────────────────────────────────────────────────────────────────────────
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Sécurité : si quelqu'un tape /xx/... avec une locale inconnue → 404 propre.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Charge les traductions côté serveur pour la locale active.
  const messages = await getMessages();

  // Lit la session depuis le cookie httpOnly (côté serveur).
  // Le JWT ne contient que { id, email, nom }. Pour avoir la photo (qui peut
  // changer après l'émission du JWT), on relit l'utilisateur dans users.json.
  const session = await getSession();
  let utilisateurInitial = null;
  if (session) {
    const u = await getUtilisateurParId(session.id);
    if (u) {
      utilisateurInitial = {
        id: u.id,
        email: u.email,
        nom: u.nom,
        image: u.image, // peut être undefined
        role: u.role, // "user" ou "admin"
      };
    }
  }

  // ⚠️ PLUS AUCUN CHARGEMENT DE CATALOGUE ICI.
  //
  // Le layout chargeait la liste entière des produits à chaque requête de
  // chaque page, y compris celles qui n'en affichent aucun. Trois choses en
  // avaient besoin, et aucune n'avait besoin de la liste complète :
  //   - le catalogue, qui la charge désormais lui-même ;
  //   - la recherche, passée côté serveur (/api/recherche) ;
  //   - le panier, qui ne demande que SES produits (/api/produits?ids=…).
  // Le compteur du panier, lui, n'a jamais eu besoin que d'un nombre.
  // Rayons de la boutique — l'overlay de recherche en a besoin sur toutes
  // les pages, pas seulement sur le catalogue.
  const categories = await getCategories();

  // RTL si arabe, LTR sinon. C'est cette ligne qui retourne toute la mise en page.
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontLatin.variable} ${fontArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
          NextIntlClientProvider rend les traductions accessibles aux composants
          CLIENT (ceux avec "use client"). Les composants serveur, eux, peuvent
          appeler getTranslations() directement.
        */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/*
            AuthProvider : connaît l'utilisateur connecté (lu côté serveur depuis
            le cookie httpOnly), expose useAuth() pour les composants client.
            CartProvider : panier persisté dans localStorage.
            Les deux englobent Navbar + pages.
          */}
          <AuthProvider utilisateurInitial={utilisateurInitial}>
            <CartProvider>
                {/* RechercheProvider rend l'overlay APRÈS le contenu de page,
                    et donc hors de l'enveloppe qui recule pendant qu'il est
                    ouvert. Les rayons lui sont passés ici : un composant
                    client ne peut pas interroger Prisma. */}
                <RechercheProvider categories={categories}>
                  <ContenuPage>
                {/* Navigation DESKTOP : masquee sous 640 px, ou la
                    navigation mobile flottante prend le relais. */}
                <div className="hidden sm:block">
                  <Navbar locale={locale as Locale} />
                </div>

                {/* Navigation MOBILE : deux barres flottantes, sous 640 px.
                    Les paddings compensent leur position fixe pour que le
                    contenu ne passe jamais dessous.
                      haut : 132 px = status bar 52 + titre/boutons + 16
                    La reserve du BAS est portee par le pied de page, qui suit
                    <main> : c est lui qui touche le bas du document, donc lui
                    que la tab bar flottante recouvrirait. */}
                <main
                  id="contenu-principal"
                  // Classes Tailwind plutot qu un style inline : le padding
                  // doit disparaitre a partir de sm, et un style inline ne
                  // peut pas etre conditionne par une media query.
                  className="flex-1 pt-[132px] sm:pt-0"
                >
                  {children}
                </main>
                <Footer />
                  </ContenuPage>

                  {/* Hors de l'enveloppe : les barres flottantes sont en
                      position fixed et doivent le rester par rapport au
                      viewport, pas par rapport au conteneur transformé. */}
                  <NavigationMobile />
                </RechercheProvider>
              </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
