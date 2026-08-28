"use client";

/**
 * Dernier filet : s'affiche quand c'est le LAYOUT RACINE lui-même qui tombe.
 *
 * À ce stade, rien du site n'est disponible — ni les traductions, ni les
 * polices, ni la barre de navigation. Ce fichier REMPLACE le layout racine,
 * il doit donc fournir ses propres `<html>` et `<body>`.
 *
 * Conséquences directes, et c'est pourquoi cette page ne ressemble pas au
 * reste du site :
 *  - pas de `next-intl` : le texte est écrit en dur, en français et en
 *    arabe, puisqu'on ne peut pas savoir quelle langue l'utilisateur
 *    attendait ;
 *  - pas de Tailwind à coup sûr : les styles sont en ligne ;
 *  - pas de `generateMetadata` : le titre passe par la balise `<title>`,
 *    comme l'indique la documentation embarquée.
 *
 * En pratique cet écran ne devrait jamais apparaître. S'il apparaît, c'est
 * que quelque chose de grave s'est produit très tôt — et il vaut mieux une
 * page sobre et bilingue que l'écran par défaut de Next.js.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#ffffff",
          color: "#111111",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
        }}
      >
        <title>Une erreur est survenue</title>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 10px",
            }}
          >
            Une erreur est survenue
          </h1>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              lineHeight: 1.5,
              color: "#57534E",
            }}
          >
            Le site n&apos;a pas pu se charger. Réessayez dans un instant.
          </p>
          <p
            dir="rtl"
            style={{
              margin: "0 0 24px",
              fontSize: 15,
              lineHeight: 1.6,
              color: "#57534E",
            }}
          >
            تعذّر تحميل الموقع. أعد المحاولة بعد قليل.
          </p>

          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              border: 0,
              cursor: "pointer",
              borderRadius: 999,
              background: "#111111",
              color: "#ffffff",
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Réessayer
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: 24,
                fontSize: 12,
                fontFamily: "ui-monospace, Menlo, monospace",
                color: "#A8A29E",
              }}
            >
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
