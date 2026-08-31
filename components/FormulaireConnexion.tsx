"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AlerteClient,
  BoutonPrincipalClient,
  BoutonsOAuthClient,
  CadreAuthClient,
  ChampClient,
} from "@/components/auth/CadreAuthClient";

/**
 * Connexion CLIENT — celui qui vient retrouver son compte et ses commandes.
 *
 * Ne pas confondre avec <FormulaireConnexionMarchand />, qui sert l'espace de
 * gestion. Les deux écrans sont volontairement distincts à l'œil : voir
 * CadreAuthClient pour les cinq choix qui les séparent.
 *
 * Appelle seConnecter() de AuthContext, qui POSTe vers /api/auth/connexion et
 * met à jour l'état client. On redirige ensuite vers /compte.
 */
export default function FormulaireConnexion() {
  const t = useTranslations("connexion");
  const { seConnecter } = useAuth();
  const router = useRouter();

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
    router.push("/compte");
    router.refresh();
  }

  return (
    <CadreAuthClient
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      bas={
        <>
          {t("pasDeCompte")}{" "}
          <Link
            href="/inscription"
            className="font-medium text-gray-900 underline underline-offset-2"
          >
            {t("creerCompte")}
          </Link>
        </>
      }
    >
      {/* DÉCORATIF — aucune connexion OAuth n'est branchée. */}
      <BoutonsOAuthClient />

      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <ChampClient
          id="client-email"
          label={t("email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampClient
          id="client-mot-de-passe"
          label={t("motDePasse")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="current-password"
        />

        {cleErreur && <AlerteClient>{t(`erreurs.${cleErreur}`)}</AlerteClient>}

        <BoutonPrincipalClient chargement={chargement}>
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </BoutonPrincipalClient>
      </form>
    </CadreAuthClient>
  );
}
