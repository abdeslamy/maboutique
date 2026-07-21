"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Bouton "Retour" : icône flèche + libellé.
 *
 * Pour le RTL : la flèche doit pointer vers la droite en arabe.
 * On utilise `rtl:-scale-x-100` (Tailwind variant) — équivalent CSS de
 * `transform: scaleX(-1)`. Cela inverse l'image horizontalement.
 *
 * On peut passer un `href` pour aller à une route précise. Si on ne passe rien,
 * c'est juste un retour en arrière dans l'historique (window.history.back()).
 */
export default function BoutonRetour({
  href,
  libelle,
}: {
  href?: string;
  libelle?: string;
}) {
  const t = useTranslations("navigation");
  const texte = libelle ?? t("retour");

  const classe =
    "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  const contenu = (
    <>
      {/* La flèche : pivote de 180° (scaleX) en RTL pour pointer vers la droite */}
      <ArrowLeft
        className="h-4 w-4 rtl:-scale-x-100"
        aria-hidden="true"
      />
      <span>{texte}</span>
    </>
  );

  if (href) {
    // Si href fourni, on utilise <Link> pour rester locale-aware et prefetch.
    return (
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={href as any}
        className={classe}
      >
        {contenu}
      </Link>
    );
  }

  // Sinon : bouton qui fait history.back().
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={classe}
    >
      {contenu}
    </button>
  );
}
