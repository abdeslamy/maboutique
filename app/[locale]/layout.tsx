import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
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

  // ⚠️ AUCUN CHARGEMENT DE DONNÉES MÉTIER ICI.
  //
  // Ce layout est traversé par TOUTES les pages, admin comprise. Tout ce
  // qu'on y charge est payé par des pages qui n'en ont que faire — c'est
  // exactement ce qui pesait sur le catalogue, puis sur les rayons.
  // L'habillage boutique et ses données vivent dans (boutique)/layout.tsx.

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
            AuthProvider : connaît l'utilisateur connecté (lu côté serveur
            depuis le cookie httpOnly), expose useAuth() aux composants client.
            CartProvider : panier persisté dans localStorage.

            Les deux restent ICI, et non dans (boutique) : l'espace marchand a
            besoin de useAuth() pour son bouton de déconnexion, et un marchand
            reste un utilisateur comme un autre s'il visite sa vitrine.

            Tout le reste — barre de navigation, pied de page, tab bar mobile,
            recherche — est descendu dans (boutique)/layout.tsx.
          */}
          <AuthProvider utilisateurInitial={utilisateurInitial}>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
