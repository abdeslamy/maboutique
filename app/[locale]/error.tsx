"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Page d'erreur d'un segment — s'affiche quand une page ou un composant
 * serveur lève une exception.
 *
 * Elle vit SOUS le layout : la barre de navigation, le pied de page et les
 * traductions restent en place. L'utilisateur garde donc un chemin de sortie
 * au lieu de se retrouver sur un écran nu.
 *
 * ⚠️ Next 16 : la fonction de reprise s'appelle `unstable_retry`, plus
 * `reset` comme dans les versions précédentes. Vérifié dans la documentation
 * embarquée (`error.md`) — la signature a changé.
 *
 * Une frontière d'erreur DOIT être un composant client : c'est React qui
 * l'attrape, côté navigateur.
 */
export default function Erreur({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("erreur");

  useEffect(() => {
    // En attendant une vraie supervision (Sentry ou équivalent), la console
    // du serveur est le seul endroit où cette trace existe.
    console.error("[erreur]", error.digest ?? "", error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h1>
        <p className="text-gray-600">{t("texte")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {t("reessayer")}
        </button>
        <Link
          href="/"
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
        >
          {t("accueil")}
        </Link>
      </div>

      {/* L'identifiant technique n'a de sens que pour nous, mais il permet à
          un client de nous décrire précisément SON incident. */}
      {error.digest && (
        <p className="font-mono text-xs text-gray-400">
          {t("reference")} : {error.digest}
        </p>
      )}
    </section>
  );
}
