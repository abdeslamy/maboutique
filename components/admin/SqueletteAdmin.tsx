/**
 * Squelettes de chargement de l'espace admin.
 *
 * Rôle réel : bien plus qu'un simple "spinner joli".
 * Un `loading.tsx` crée une frontière Suspense, et c'est CETTE frontière qui
 * autorise Next.js à précharger une route DYNAMIQUE au survol du lien.
 * Sans elle, la doc est explicite : « Prefetched : No, unless loading.js ».
 *
 * Conséquence : la coquille (sidebar + squelette) s'affiche immédiatement au
 * clic, et le contenu réel arrive en streaming derrière.
 *
 * Les formes reprennent celles des vraies pages pour éviter que la mise en page
 * ne saute au moment de la substitution.
 */

function Barre({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

function Carte({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-gray-200 bg-white ${className}`}
    />
  );
}

/** En-tête commun : titre + sous-titre. */
function EnTete() {
  return (
    <div className="mb-6">
      <Barre className="h-7 w-56" />
      <Barre className="mt-2 h-4 w-72" />
    </div>
  );
}

/** Dashboard : 4 KPI + 2 graphiques + 2 blocs. */
export function SqueletteDashboard() {
  return (
    <>
      <EnTete />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Carte key={i} className="h-32" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Carte className="h-72" />
        <Carte className="h-72" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Carte className="h-56" />
        <Carte className="h-56" />
      </div>
    </>
  );
}

/** Listes (produits, commandes) : en-tête + recherche + lignes. */
export function SqueletteListe({ lignes = 5 }: { lignes?: number }) {
  return (
    <>
      <EnTete />
      <Barre className="mb-6 h-9 w-full max-w-md rounded-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: lignes }).map((_, i) => (
          <Carte key={i} className="h-24" />
        ))}
      </div>
    </>
  );
}
