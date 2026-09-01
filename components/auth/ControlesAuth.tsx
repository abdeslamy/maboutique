"use client";

import { useTranslations } from "next-intl";
import { CadreLogo, LogoApple, LogoGoogle } from "@/components/admin/LogosOAuth";

/**
 * Les briques des quatre écrans d'accès — carte, champs, bouton, alerte,
 * connexions Google et Apple.
 *
 * Extraites pour la même raison que le cadre : les deux familles d'écrans
 * avaient chacune ses classes, et elles ont divergé. Champs à 11 de rayon d'un
 * côté et 16 de l'autre, bouton rectangulaire contre pilule, séparateur à 20
 * contre 22. Un seul jeu de briques ne peut plus diverger.
 *
 * Les valeurs retenues sont celles de la maquette 4a : contrôles de 52 px,
 * rayon 11, focus noir sans anneau, carte à 28 de rayon et 34 de retrait.
 */

/** Hauteur commune à tous les contrôles. C'est elle qui donne le rythme. */
const HAUTEUR = "h-[52px]";

/** Champ de saisie. Focus noir, sans anneau coloré. */
const CHAMP =
  `${HAUTEUR} w-full rounded-[11px] border border-[#ded8ce] bg-white px-[18px] ` +
  "text-[15.5px] text-[#0a0a0a] placeholder:text-[#a49c91] " +
  "focus:border-[#0a0a0a] focus:outline-none";

/**
 * La carte flottante.
 *
 * Le resserrement sur les écrans peu hauts est porté ici et non par la page :
 * c'est la carte qui contient les blancs à réduire.
 */
export function CarteAuth({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-[28px] border border-[#f4f1ec] bg-white px-[34px] pb-7 pt-[34px] [@media(max-height:899px)]:pb-5 [@media(max-height:899px)]:pt-6"
      style={{
        boxShadow: "0 20px 48px rgba(52,42,28,.09), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Google et Apple, puis le séparateur.
 *
 * ⚠️ DÉCORATIFS sur les quatre écrans : aucune connexion OAuth n'est branchée.
 * Ils portent `aria-disabled` et sortent du parcours au clavier, pour qu'on ne
 * bute pas dessus en tabulant. Le jour où la mécanique arrive, il suffit de
 * brancher un `onClick` et de retirer ces deux attributs — la mise en page ne
 * bouge pas d'un pixel.
 */
export function BoutonsOAuth() {
  const t = useTranslations("authPartage");

  const bouton =
    `${HAUTEUR} flex w-full items-center justify-center gap-[11px] rounded-[11px] ` +
    "border border-[#e2ddd4] bg-white text-[15.5px] font-medium text-[#0a0a0a] " +
    "transition-[border-color,box-shadow] hover:border-[#cdc6ba]";

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={bouton}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoGoogle />
          </CadreLogo>
          {t("continuerGoogle")}
        </button>

        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={bouton}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoApple />
          </CadreLogo>
          {t("continuerApple")}
        </button>
      </div>

      <div className="my-[22px] flex items-center gap-3.5 [@media(max-height:899px)]:my-3.5">
        <span className="h-px flex-1 bg-[#e9e4db]" />
        <span className="text-[11.5px] font-medium tracking-[.09em] text-[#9a9288]">
          {t("ou")}
        </span>
        <span className="h-px flex-1 bg-[#e9e4db]" />
      </div>
    </>
  );
}

/**
 * Un champ.
 *
 * Le libellé est MASQUÉ visuellement mais bien présent : un placeholder n'est
 * pas un nom accessible, il disparaît à la saisie et beaucoup de lecteurs
 * d'écran ne l'annoncent pas.
 */
export function ChampAuth({
  id,
  label,
  placeholder,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={CHAMP}
      />
    </>
  );
}

/** Le bouton principal, plein noir. */
export function BoutonAuth({
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
      className={`${HAUTEUR} w-full rounded-[11px] bg-[#0a0a0a] text-[15.5px] font-semibold text-white transition-[background-color,box-shadow] hover:bg-[#1c1c1c] disabled:opacity-60`}
      style={{ boxShadow: "0 4px 14px rgba(10,10,10,.18)" }}
    >
      {children}
    </button>
  );
}

/** Le bloc d'erreur, au même rayon que les champs. */
export function AlerteAuth({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[11px] bg-[#fbf1ee] px-[18px] py-3.5 text-[13.5px] leading-[1.45] text-[#9c3a29]"
    >
      {children}
    </div>
  );
}

/**
 * Les mentions légales sous le formulaire.
 *
 * ⚠️ DÉCORATIVES : les pages CGU et confidentialité n'existent pas. Le texte
 * est souligné comme dans la maquette, sans destination.
 */
export function MentionsAuth() {
  const t = useTranslations("authPartage");

  const souligne = (chunks: React.ReactNode) => (
    <span
      role="link"
      aria-disabled="true"
      className="cursor-default underline underline-offset-2"
    >
      {chunks}
    </span>
  );

  return (
    <p className="mt-5 text-center text-[12.5px] leading-[1.55] text-[#8b8377] [@media(max-height:899px)]:mt-3.5">
      {t.rich("mentions", { cgu: souligne, confid: souligne })}
    </p>
  );
}

/** Le lien sous la carte, vers l'écran jumeau. */
export function LienBasAuth({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-7 text-center text-[13.5px] text-[#8b8377] [@media(max-height:899px)]:mt-[18px]">
      {children}
    </p>
  );
}

/** Le soulignement discret des liens du bas. */
export const LIEN_SOULIGNE =
  "border-b border-[#d6cfc4] pb-[3px] font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a]";
