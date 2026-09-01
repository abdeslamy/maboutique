"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlerteAuth,
  BoutonAuth,
  BoutonsOAuth,
  CarteAuth,
  ChampAuth,
  MentionsAuth,
} from "@/components/auth/ControlesAuth";

/**
 * Ouverture de boutique — la création d'un accès vendeur.
 *
 * Exactement la même carte que la création de compte client : mêmes briques,
 * même géométrie. Seuls les champs diffèrent.
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
 */
export default function FormulaireInscriptionMarchand() {
  const t = useTranslations("inscriptionMarchand");

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

  return (
    <CarteAuth>
      {/* DÉCORATIF — aucune connexion OAuth n'est branchée. */}
      <BoutonsOAuth />

      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        {/* Trois champs, pas un de plus. Wilaya, téléphone, logo, description
            et grille de livraison ne conditionnent pas l'existence d'une
            boutique : ils appartiennent à la mise en route, une fois la
            personne entrée. Un formulaire d'ouverture long est le premier
            endroit où l'on perd les gens. */}
        <ChampAuth
          id="boutique-nom"
          label={t("nomBoutique")}
          placeholder={t("nomBoutiquePlaceholder")}
          type="text"
          value={nomBoutique}
          onChange={setNomBoutique}
          autoComplete="organization"
        />
        <ChampAuth
          id="boutique-email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampAuth
          id="boutique-mot-de-passe"
          label={t("motDePasse")}
          placeholder={t("motDePassePlaceholder")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          minLength={8}
        />

        {indisponible && <AlerteAuth>{t("indisponible")}</AlerteAuth>}

        <BoutonAuth>{t("creer")}</BoutonAuth>
      </form>

      {/* La mention est ici à sa place : c'est une création de compte, le
          moment où l'on accepte réellement des conditions. */}
      <MentionsAuth />
    </CarteAuth>
  );
}
