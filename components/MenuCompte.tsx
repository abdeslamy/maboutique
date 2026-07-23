"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Package, Settings, Shield, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";

/**
 * Menu déroulant utilisateur.
 *
 * Concepts pédagogiques utilisés :
 *
 *  1. useRef : on garde une référence vers la <div> du menu, pour pouvoir
 *     vérifier "le clic est-il à l'intérieur ?".
 *
 *  2. useEffect + addEventListener('mousedown') : on écoute les clics partout
 *     dans le document. Si le clic n'est PAS dans notre ref → on ferme.
 *     Pareil pour la touche Escape.
 *
 *  3. Cleanup (return du useEffect) : on retire les listeners au démontage,
 *     sinon on accumule des écouteurs fantômes ("memory leak").
 *
 *  4. RTL : on place le menu avec end-0 → en LTR il se colle à droite du bouton,
 *     en RTL il se colle à gauche. Aucune logique JS à écrire.
 */
export default function MenuCompte() {
  const t = useTranslations("navigation");
  const { utilisateur, seDeconnecter } = useAuth();
  const router = useRouter();

  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Fermer au clic en dehors + à la touche Échap
  useEffect(() => {
    if (!ouvert) return;

    function clicExterieur(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    function toucheEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", clicExterieur);
    document.addEventListener("keydown", toucheEchap);

    // Cleanup : on retire les listeners quand "ouvert" repasse à false
    // ou quand le composant est démonté.
    return () => {
      document.removeEventListener("mousedown", clicExterieur);
      document.removeEventListener("keydown", toucheEchap);
    };
  }, [ouvert]);

  async function deconnecter() {
    setOuvert(false);
    await seDeconnecter();
    router.push("/");
    router.refresh();
  }

  if (!utilisateur) {
    return (
      <Link
        href="/connexion"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-black sm:px-3"
        aria-label={t("connexion")}
      >
        {/* Icône sur mobile, texte sur desktop */}
        <LogIn className="h-4 w-4 sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">{t("connexion")}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Bouton avatar (déclencheur du menu) */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={t("compte")}
        className="flex items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <Avatar nom={utilisateur.nom} image={utilisateur.image} taille="md" />
      </button>

      {/* Menu déroulant */}
      {ouvert && (
        <div
          role="menu"
          // end-0 colle le menu au "end" du bouton (right en LTR, left en RTL)
          className="absolute end-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          {/* En-tête : nom + email */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">
              {utilisateur.nom}
            </p>
            <p className="truncate text-xs text-gray-500">{utilisateur.email}</p>
          </div>

          {/* Liens */}
          <ul className="py-1 text-sm">
            <ElementMenu
              href="/compte"
              icon={<UserIcon className="h-4 w-4" />}
              label={t("compte")}
              onClick={() => setOuvert(false)}
            />
            <ElementMenu
              href="/compte/parametres"
              icon={<Settings className="h-4 w-4" />}
              label={t("parametres")}
              onClick={() => setOuvert(false)}
            />
            <ElementMenu
              href="/compte"
              icon={<Package className="h-4 w-4" />}
              label={t("mesCommandes")}
              onClick={() => setOuvert(false)}
            />
            {/* Lien Admin visible UNIQUEMENT pour les admins */}
            {utilisateur.role === "admin" && (
              <ElementMenu
                href="/admin"
                icon={<Shield className="h-4 w-4" />}
                label={t("admin")}
                onClick={() => setOuvert(false)}
              />
            )}
          </ul>

          {/* Déconnexion en rouge */}
          <div className="border-t border-gray-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={deconnecter}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("deconnexion")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ElementMenu({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={href as any}
        onClick={onClick}
        role="menuitem"
        className="flex items-center gap-2 px-4 py-2 text-gray-700 transition hover:bg-gray-50 hover:text-black"
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
