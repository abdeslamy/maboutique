"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { cheminDeRetour, PARAM_SUITE } from "@/lib/redirection";
import { useAuth } from "@/context/AuthContext";
import {
  AlerteAuth,
  BoutonAuth,
  BoutonsOAuth,
  CarteAuth,
  ChampAuth,
} from "@/components/auth/ControlesAuth";

/**
 * Connexion CLIENT — celui qui vient retrouver son compte et ses commandes.
 *
 * Exactement la même carte que la connexion vendeur : mêmes briques, même
 * géométrie. Ce qui distingue les deux écrans est ailleurs — le titre, et le
 * panneau de droite.
 *
 * Appelle seConnecter() de AuthContext, qui POSTe vers /api/auth/connexion et
 * met à jour l'état client. On redirige ensuite vers /compte.
 */
export default function FormulaireConnexion() {
  const t = useTranslations("connexion");
  const { seConnecter } = useAuth();
  const router = useRouter();

  // D'où vient la personne. Même filtre que la page : un chemin interne, ou
  // rien. useSearchParams vient de next/navigation et non de @/i18n/navigation
  // — la recherche d'URL ne dépend pas de la langue.
  const suite = cheminDeRetour(useSearchParams().get(PARAM_SUITE), "/compte");

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setCleErreur(null);
    setChargement(true);

    const resultat = await seConnecter(email, motDePasse);

    if (!resultat.ok) {
      setCleErreur(resultat.cleErreur);
      setChargement(false);
      return;
    }

    // router.refresh() force le re-rendu des composants serveur pour qu'ils
    // prennent en compte le nouveau cookie de session.
    //
    // On retourne là d'où l'on vient — une fiche produit, le panier — et non
    // sur /compte par défaut : se connecter au milieu d'un achat ne doit pas
    // faire perdre sa page.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(suite as any);
    router.refresh();
  }

  return (
    <CarteAuth>
      {/* DÉCORATIF — aucune connexion OAuth n'est branchée. */}
      <BoutonsOAuth />

      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        <ChampAuth
          id="client-email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampAuth
          id="client-mot-de-passe"
          label={t("motDePasse")}
          placeholder={t("motDePassePlaceholder")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="current-password"
        />

        {cleErreur && <AlerteAuth>{t(`erreurs.${cleErreur}`)}</AlerteAuth>}

        <BoutonAuth chargement={chargement}>
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </BoutonAuth>
      </form>
    </CarteAuth>
  );
}
