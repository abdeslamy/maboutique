"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlerteClient,
  BoutonPrincipalClient,
  CadreAuthClient,
  ChampClient,
} from "@/components/auth/CadreAuthClient";

/**
 * Création de compte CLIENT — nom, e-mail, mot de passe et confirmation.
 *
 * Ne pas confondre avec <FormulaireInscriptionMarchand />, qui ouvre une
 * BOUTIQUE. Les deux écrans sont volontairement distincts à l'œil : voir
 * CadreAuthClient pour les cinq choix qui les séparent.
 *
 * ⚠️ La validation ci-dessous est un confort d'affichage, pas une protection.
 * Le client peut être contourné : la seule barrière qui compte est celle de
 * /api/auth/inscription, qui refait les mêmes contrôles côté serveur.
 */
export default function FormulaireInscription() {
  const t = useTranslations("inscription");

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Clé de traduction de l'erreur en cours (ex : "mot_de_passe_court").
  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setCleErreur(null);

    // ── Contrôles d'affichage — le serveur les refait tous ─────────────
    if (nom.trim().length < 2) {
      setCleErreur("nom_court");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCleErreur("email_invalide");
      return;
    }
    if (motDePasse.length < 8) {
      setCleErreur("mot_de_passe_court");
      return;
    }
    if (motDePasse !== confirmation) {
      setCleErreur("confirmation_differente");
      return;
    }

    setChargement(true);
    try {
      const res = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, motDePasse }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCleErreur(data.erreur ?? "erreur_serveur");
        return;
      }

      setSucces(true);
    } catch {
      setCleErreur("erreur_serveur");
    } finally {
      setChargement(false);
    }
  }

  // ── Vue « succès » ────────────────────────────────────────────────────
  // Reprend la même carte que le formulaire, pour que l'écran ne se dérobe
  // pas sous les pieds au moment où tout s'est bien passé.
  if (succes) {
    return (
      <CadreAuthClient titre={t("succesTitre")} sousTitre={t("succesMessage")}>
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          {/* Le vert de la boutique, en pastille. Seule touche de couleur de
              l'écran, et elle n'apparaît qu'une fois : au bon moment. */}
          <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5 L10 17.5 L19 7" />
            </svg>
          </span>

          <Link
            href="/connexion"
            className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white transition hover:bg-gray-800"
          >
            {t("seConnecter")}
          </Link>
        </div>
      </CadreAuthClient>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────────────
  return (
    <CadreAuthClient
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      bas={
        <>
          {t("dejaInscrit")}{" "}
          <Link
            href="/connexion"
            className="font-medium text-gray-900 underline underline-offset-2"
          >
            {t("seConnecter")}
          </Link>
        </>
      }
    >
      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <ChampClient
          id="inscription-nom"
          label={t("nom")}
          type="text"
          value={nom}
          onChange={setNom}
          autoComplete="name"
        />
        <ChampClient
          id="inscription-email"
          label={t("email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampClient
          id="inscription-mot-de-passe"
          label={t("motDePasse")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          aide={t("motDePasseAide")}
        />
        <ChampClient
          id="inscription-confirmation"
          label={t("confirmation")}
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />

        {cleErreur && <AlerteClient>{t(`erreurs.${cleErreur}`)}</AlerteClient>}

        <BoutonPrincipalClient chargement={chargement}>
          {chargement ? t("creation") : t("creerCompte")}
        </BoutonPrincipalClient>
      </form>
    </CadreAuthClient>
  );
}
