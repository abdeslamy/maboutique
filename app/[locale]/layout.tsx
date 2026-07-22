import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { getAllProduits } from "@/lib/products";
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

  // Charge tous les produits une seule fois (côté serveur) pour les partager
  // avec les composants client via ProductsProvider. Comme le catalogue est
  // petit, on peut se permettre de tout charger. Pour un catalogue large,
  // on passerait au chargement à la demande.
  const produits = await getAllProduits();

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
            {/* ProductsProvider expose la liste des produits aux composants client. */}
            <ProductsProvider produits={produits}>
              <CartProvider>
                <Navbar locale={locale as Locale} />
                <main className="flex-1">{children}</main>
                <Footer />
              </CartProvider>
            </ProductsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
