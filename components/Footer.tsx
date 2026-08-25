import { getTranslations } from "next-intl/server";

// Pied de page sobre, visible sur toutes les pages.
// Affiche le copyright, avec l'année calculée à la volée côté serveur.
export default async function Footer() {
  const t = await getTranslations("footer");
  const tMeta = await getTranslations("meta");
  const annee = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      {/* Sous 640 px, la tab bar flotte au-dessus de la page : sans cette
          réserve, elle recouvre la dernière ligne du pied de page. Elle est
          portée ici et non par <main>, qui est suivi par le pied de page —
          la réserve doit se trouver tout en bas du document. */}
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 pb-[calc(24px+80px+env(safe-area-inset-bottom,0px))] pt-6 text-sm text-gray-600 sm:pb-6">
        <p>
          © {annee} {tMeta("titreSite")} — {t("droits")}
        </p>
      </div>
    </footer>
  );
}
