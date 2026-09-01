"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AlerteAuth,
  BoutonAuth,
  BoutonsOAuth,
  CarteAuth,
  ChampAuth,
} from "@/components/auth/ControlesAuth";

/**
 * Connexion VENDEUR — celui qui vient gérer sa boutique.
 *
 * Exactement la même carte que la connexion client : mêmes briques, même
 * géométrie. Trois choses seulement lui sont propres :
 *
 *  1. La destination. Ici /admin, pas /compte.
 *  2. Pas de lien « créer un compte » dans la carte : un vendeur ne s'inscrit
 *     pas au milieu d'un formulaire de connexion.
 *  3. Le cas du client égaré. Ses identifiants sont valides, mais il n'a rien
 *     à faire ici. L'envoyer sur /admin lui donnerait un 404 sec ; on lui dit
 *     ce qui se passe et on lui rouvre la boutique.
 */
export default function FormulaireConnexionMarchand() {
  const t = useTranslations("connexionMarchand");
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

    if (resultat.role !== "admin") {
      // Compte valide, mais côté acheteur. La session est bel et bien ouverte
      // — on ne la referme pas, elle est légitime : on l'oriente.
      setCleErreur("pas_marchand");
      setChargement(false);
      return;
    }

    // router.refresh() force le re-rendu des composants serveur pour qu'ils
    // voient le nouveau cookie de session — sans quoi le layout /admin
    // relirait l'ancienne session et redirigerait ici même.
    router.push("/admin");
    router.refresh();
  }

  return (
    <CarteAuth>
      {/* DÉCORATIF — aucune connexion OAuth n'est branchée. */}
      <BoutonsOAuth />

      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        <ChampAuth
          id="marchand-email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampAuth
          id="marchand-mot-de-passe"
          label={t("motDePasse")}
          placeholder={t("motDePassePlaceholder")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="current-password"
        />

        {cleErreur && (
          <AlerteAuth>
            <p>{t(`erreurs.${cleErreur}`)}</p>

            {/* Le client égaré repart vers la boutique plutôt que de buter sur
                un formulaire qui ne le concerne pas. C'est un VRAI lien : la
                seule sortie utile de l'écran. */}
            {cleErreur === "pas_marchand" && (
              <Link
                href="/"
                className="mt-1 inline-block font-medium underline underline-offset-2"
              >
                {t("retourBoutique")}
              </Link>
            )}
          </AlerteAuth>
        )}

        <BoutonAuth chargement={chargement}>
          {chargement ? t("connexionEnCours") : t("continuerEmail")}
        </BoutonAuth>
      </form>
    </CarteAuth>
  );
}
