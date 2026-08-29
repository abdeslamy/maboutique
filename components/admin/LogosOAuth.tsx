/**
 * Les logos Google et Apple des boutons de connexion, partagés par les deux
 * écrans d'accès.
 *
 * ⚠️ Ces boutons sont DÉCORATIFS partout où ils apparaissent : aucune connexion
 * OAuth n'est branchée. Ils sont conservés parce que la maquette les montre,
 * mais leur clic ne déclenche rien.
 */

/**
 * Cadre commun aux deux logos.
 *
 * Sans lui, les deux boutons n'auraient pas le même retrait : le cadre SVG de
 * Google fait 18 px, celui d'Apple 22, et comme le contenu du bouton est
 * centré, l'écart se répercuterait sur le libellé — 2 px de décalage entre les
 * deux lignes. Un cadre fixe de 22 px les aligne exactement.
 */
export function CadreLogo({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

/** Logo Google, quatre couleurs, 18 px. */
export function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.83Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

/**
 * Logo Apple, monochrome.
 *
 * Rendu à 22 px et non 18 comme Google, et ce n'est pas une erreur : les deux
 * dessins ne remplissent pas leur cadre de la même façon. Mesuré — Google
 * occupe 91,7 % de son viewBox, Apple seulement 75 %. À cadre égal, la pomme
 * paraissait un cinquième plus petite.
 *
 * 16,5 / 0,75 = 22 : les deux glyphes font désormais 16,5 px optiques. Leurs
 * centres coïncidaient déjà avec celui du viewBox, l'alignement vertical
 * n'avait rien à corriger.
 */
export function LogoApple() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a0a0a" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}
