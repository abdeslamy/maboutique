/**
 * Mini-graphique SVG « sparkline » — pas de dépendance, ultra léger.
 * Trace une ligne + zone dégradée à partir d'un tableau de valeurs.
 */
export default function Sparkline({
  valeurs,
  couleur = "text-green-500",
  hauteur = 40,
}: {
  valeurs: number[];
  /** classe tailwind text-... utilisée comme currentColor pour trait/gradient */
  couleur?: string;
  hauteur?: number;
}) {
  if (valeurs.length === 0) return null;
  const max = Math.max(...valeurs, 1);
  const min = Math.min(...valeurs, 0);
  const largeur = 100; // viewBox largeur (unité)
  const range = max - min || 1;

  // Points x/y (0..100 pour largeur, 0..hauteur pour y)
  const pts = valeurs.map((v, i) => {
    const x = (i / (valeurs.length - 1 || 1)) * largeur;
    const y = hauteur - ((v - min) / range) * hauteur;
    return `${x},${y}`;
  });
  const path = "M " + pts.join(" L ");
  const zone = `${path} L ${largeur},${hauteur} L 0,${hauteur} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className={`w-full ${couleur}`}
      style={{ height: hauteur }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={zone} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
