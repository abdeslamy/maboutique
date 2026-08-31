"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CadreLogo, LogoApple, LogoGoogle } from "@/components/admin/LogosOAuth";

/**
 * Ouverture de boutique — la création d'un accès vendeur.
 *
 * ⚠️ CETTE MAQUETTE NE CRÉE RIEN. Elle est complète et interactive — la saisie
 * fonctionne, la validation du navigateur aussi — mais l'envoi n'aboutit à
 * aucune boutique, et le formulaire le dit franchement plutôt que de faire
 * semblant.
 *
 * Ce n'est pas un oubli, c'est l'état du produit. Vérifié dans le code :
 * `creerUtilisateur` rattache toujours le nouveau compte à la boutique
 * courante, avec le rôle « user ». Aucune création de Boutique n'existe nulle
 * part. Ouvrir vraiment une boutique demanderait :
 *
 *   1. créer une ligne Boutique (nom, slug dérivé et vérifié unique) ;
 *   2. créer l'Utilisateur avec le rôle admin DANS cette boutique ;
 *   3. régler la dette d'identité produit — `Produit.id` est encore un slug
 *      global, donc deux boutiques qui vendent un « vase-terre-cuite »
 *      entreraient en collision ;
 *   4. décider si l'ouverture est libre ou sur invitation.
 *
 * Les points 1 et 2 sont une soirée de travail ; le 3 est un lot à part, déjà
 * repéré dans docs/multi-boutiques.md ; le 4 est une décision produit.
 *
 * Google et Apple sont décoratifs pour la même raison que sur la connexion :
 * aucune connexion OAuth n'est branchée. Ils portent `aria-disabled` et
 * sortent du parcours au clavier.
 */
export default function FormulaireInscriptionMarchand() {
  const t = useTranslations("inscriptionMarchand");
  // Libellés communs à TOUS les écrans d'accès, client comme vendeur.
  const ta = useTranslations("authPartage");

  const [nomBoutique, setNomBoutique] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [indisponible, setIndisponible] = useState(false);

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    // Rien à envoyer : on le dit, on ne le cache pas derrière un chargement
    // qui n'aboutirait jamais.
    setIndisponible(true);
  }

  const boutonOAuth =
    "flex h-[52px] w-full items-center justify-center gap-[11px] rounded-[11px] " +
    "border border-[#e2ddd4] bg-white text-[15.5px] font-medium text-[#0a0a0a] " +
    "transition-[border-color,box-shadow] hover:border-[#cdc6ba]";

  const champ =
    "h-[52px] w-full rounded-[11px] border border-[#ded8ce] bg-white px-[18px] " +
    "text-[15.5px] text-[#0a0a0a] placeholder:text-[#a49c91] " +
    "focus:border-[#0a0a0a] focus:outline-none";

  /** Souligné des mentions légales. DÉCORATIF — sans destination. */
  const mentionSoulignee = (chunks: React.ReactNode) => (
    <span
      role="link"
      aria-disabled="true"
      className="cursor-default underline underline-offset-2"
    >
      {chunks}
    </span>
  );

  return (
    <div
      className="w-full max-w-[452px] rounded-[28px] border border-[#f4f1ec] bg-white px-[34px] pb-7 pt-[34px] [@media(max-height:899px)]:pb-5 [@media(max-height:899px)]:pt-6"
      style={{
        boxShadow: "0 20px 48px rgba(52,42,28,.09), 0 2px 6px rgba(52,42,28,.04)",
      }}
    >
      {/* ── DÉCORATIF : aucune connexion OAuth n'est branchée ──────────── */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={boutonOAuth}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoGoogle />
          </CadreLogo>
          {ta("continuerGoogle")}
        </button>

        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className={boutonOAuth}
          style={{ boxShadow: "0 1px 2px rgba(17,17,17,.04)" }}
        >
          <CadreLogo>
            <LogoApple />
          </CadreLogo>
          {ta("continuerApple")}
        </button>
      </div>

      <div className="my-[22px] flex items-center gap-3.5 [@media(max-height:899px)]:my-3.5">
        <span className="h-px flex-1 bg-[#e9e4db]" />
        <span className="text-[11.5px] font-medium tracking-[.09em] text-[#9a9288]">
          {ta("ou")}
        </span>
        <span className="h-px flex-1 bg-[#e9e4db]" />
      </div>

      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        {/* Trois champs, pas un de plus. Wilaya, téléphone, logo, description
            et grille de livraison ne conditionnent pas l'existence d'une
            boutique : ils appartiennent à la mise en route, une fois la
            personne entrée. Un formulaire d'ouverture long est le premier
            endroit où l'on perd les gens. */}
        <label htmlFor="boutique-nom" className="sr-only">
          {t("nomBoutique")}
        </label>
        <input
          id="boutique-nom"
          type="text"
          value={nomBoutique}
          onChange={(e) => setNomBoutique(e.target.value)}
          placeholder={t("nomBoutiquePlaceholder")}
          autoComplete="organization"
          required
          className={champ}
        />

        <label htmlFor="boutique-email" className="sr-only">
          {t("email")}
        </label>
        <input
          id="boutique-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          className={champ}
        />

        <label htmlFor="boutique-mot-de-passe" className="sr-only">
          {t("motDePasse")}
        </label>
        <input
          id="boutique-mot-de-passe"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder={t("motDePassePlaceholder")}
          autoComplete="new-password"
          minLength={8}
          required
          className={champ}
        />

        {indisponible && (
          <div
            role="alert"
            className="rounded-[11px] bg-[#fbf1ee] px-[18px] py-3.5 text-[13.5px] leading-[1.45] text-[#9c3a29]"
          >
            {t("indisponible")}
          </div>
        )}

        <button
          type="submit"
          className="h-[52px] w-full rounded-[11px] bg-[#0a0a0a] text-[15.5px] font-semibold text-white transition-[background-color,box-shadow] hover:bg-[#1c1c1c]"
          style={{ boxShadow: "0 4px 14px rgba(10,10,10,.18)" }}
        >
          {t("creer")}
        </button>
      </form>

      {/* ── DÉCORATIF : les pages CGU et confidentialité n'existent pas ──
          Ici la mention est en revanche à sa place : c'est une CRÉATION de
          compte, le moment où l'on accepte réellement des conditions. Sur la
          connexion, elle n'était qu'un héritage de la maquette. */}
      <p className="mt-5 text-center text-[12.5px] leading-[1.55] text-[#8b8377] [@media(max-height:899px)]:mt-3.5">
        {ta.rich("mentions", { cgu: mentionSoulignee, confid: mentionSoulignee })}
      </p>
    </div>
  );
}
