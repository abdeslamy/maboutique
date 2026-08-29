"use client";

/**
 * Le cadre des écrans de compte CLIENT — connexion et création de compte.
 *
 * ── Pourquoi il ne ressemble PAS à l'espace vendeur ────────────────────────
 *
 * Les deux familles d'écrans doivent être reconnaissables au premier coup
 * d'œil, sans lire un mot. La distinction ne tient donc pas à un détail mais à
 * cinq choix qui vont tous dans le même sens :
 *
 *   |                | Vendeur (/admin)          | Client (la vitrine)      |
 *   |----------------|---------------------------|--------------------------|
 *   | habillage      | plein écran nu            | DANS la boutique —       |
 *   |                |                           | barre, pied, tab bar     |
 *   | colonnes       | deux, panneau décoratif   | une seule, centrée       |
 *   | fond           | crème #fefdfc             | le blanc de la boutique  |
 *   | titres         | Newsreader, serif, léger  | police de la boutique,   |
 *   |                |                           | sans-serif, semi-gras    |
 *   | boutons        | rectangle, radius 11      | PILULE, comme partout    |
 *   |                |                           | ailleurs sur la vitrine  |
 *
 * Le plus fort des cinq est le premier, et il est gratuit : le client reste
 * chez lui, avec la barre de navigation et le pied de page de la boutique
 * autour de l'écran. Le vendeur, lui, est passé derrière le rideau.
 *
 * Deux différences de forme achèvent le travail : les libellés des champs
 * restent VISIBLES ici, là où l'espace vendeur les masque au profit
 * d'indications dans les champs — plus chaleureux, et plus sûr pour quelqu'un
 * qui ne crée un compte qu'une fois. Et le bouton principal est une pilule,
 * la forme employée partout ailleurs dans la vitrine (41 occurrences).
 *
 * ── Ce qui est repris de l'espace vendeur ─────────────────────────────────
 *
 * Le NIVEAU d'exécution, pas l'apparence : une vraie carte flottante, des
 * champs de 52 px, des espacements réguliers. Un client ne mérite pas un
 * formulaire moins soigné parce qu'il achète au lieu de vendre.
 */

/** Hauteur commune aux champs et au bouton — la même que côté vendeur. */
const HAUTEUR_CONTROLE = "h-[52px]";

export function CadreAuthClient({
  titre,
  sousTitre,
  children,
  bas,
}: {
  titre: string;
  sousTitre: string;
  /** Le contenu de la carte. */
  children: React.ReactNode;
  /**
   * Le lien sous la carte, vers l'autre écran. Fourni par le formulaire, qui
   * utilise le <Link> localisé de @/i18n/navigation — un <a> brut perdrait le
   * préfixe de langue.
   */
  bas?: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[480px] px-4 py-14 sm:py-20">
      <h1 className="text-center text-[30px] font-semibold leading-[1.15] tracking-tight text-gray-900 sm:text-[34px]">
        {titre}
      </h1>
      <p className="mx-auto mt-3 max-w-[380px] text-pretty text-center text-[15.5px] leading-[1.5] text-gray-500">
        {sousTitre}
      </p>

      {/* La carte pose sur du blanc, pas sur de la crème : c'est la bordure
          qui la détache, l'ombre ne fait que la décoller un peu. Une ombre
          aussi marquée que côté vendeur flotterait dans le vide. */}
      <div
        className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7"
        style={{
          boxShadow: "0 10px 34px rgba(17,17,17,.055), 0 1px 3px rgba(17,17,17,.04)",
        }}
      >
        {children}
      </div>

      {bas && (
        <p className="mt-6 text-center text-sm text-gray-600">{bas}</p>
      )}
    </section>
  );
}

/**
 * Un champ, libellé visible au-dessus.
 *
 * `rounded-2xl` (16 px) là où l'espace vendeur est à 11 : l'écart est
 * perceptible côte à côte, et il va avec le bouton en pilule.
 */
export function ChampClient({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  aide,
  minLength,
}: {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  aide?: string;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13.5px] font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={`${HAUTEUR_CONTROLE} w-full rounded-2xl border border-gray-200 bg-white px-4 text-[15.5px] text-gray-900 transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:outline-none`}
      />
      {aide && <span className="text-xs text-gray-500">{aide}</span>}
    </div>
  );
}

/** Le bouton principal — une PILULE, la forme de toute la vitrine. */
export function BoutonPrincipalClient({
  chargement,
  children,
}: {
  chargement?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={chargement}
      className={`${HAUTEUR_CONTROLE} mt-1 w-full rounded-full bg-black text-[15px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

/** Le bloc d'erreur, au même rayon que les champs. */
export function AlerteClient({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] leading-[1.45] text-red-700"
    >
      {children}
    </p>
  );
}
