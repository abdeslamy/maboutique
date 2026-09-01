"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlerteAuth,
  BoutonAuth,
  BoutonsOAuth,
  CarteAuth,
  ChampAuth,
  MentionsAuth,
} from "@/components/auth/ControlesAuth";

/**
 * Création de compte CLIENT — nom, e-mail, mot de passe et confirmation.
 *
 * Exactement la même carte que l'ouverture de boutique : mêmes briques, même
 * géométrie. Ce qui distingue les deux écrans est ailleurs — le titre, et le
 * panneau de droite.
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
  // Garde la même carte : l'écran ne se dérobe pas sous les pieds au moment
  // où tout s'est bien passé.
  if (succes) {
    return (
      <CarteAuth>
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eaf2ec]">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2f7d4f"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5 L10 17.5 L19 7" />
            </svg>
          </span>

          <p className="text-[15.5px] leading-[1.5] text-[#5d564d]">
            {t("succesMessage")}
          </p>

          <Link
            href="/connexion"
            className="flex h-[52px] w-full items-center justify-center rounded-[11px] bg-[#0a0a0a] text-[15.5px] font-semibold text-white transition-colors hover:bg-[#1c1c1c]"
          >
            {t("seConnecter")}
          </Link>
        </div>
      </CarteAuth>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────────────
  return (
    <CarteAuth>
      {/* DÉCORATIF — aucune connexion OAuth n'est branchée. */}
      <BoutonsOAuth />

      <form onSubmit={soumettre} className="flex flex-col gap-2.5">
        <ChampAuth
          id="inscription-nom"
          label={t("nom")}
          placeholder={t("nomPlaceholder")}
          type="text"
          value={nom}
          onChange={setNom}
          autoComplete="name"
        />
        <ChampAuth
          id="inscription-email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <ChampAuth
          id="inscription-mot-de-passe"
          label={t("motDePasse")}
          placeholder={t("motDePassePlaceholder")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          minLength={8}
        />
        <ChampAuth
          id="inscription-confirmation"
          label={t("confirmation")}
          placeholder={t("confirmationPlaceholder")}
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />

        {cleErreur && <AlerteAuth>{t(`erreurs.${cleErreur}`)}</AlerteAuth>}

        <BoutonAuth chargement={chargement}>
          {chargement ? t("creation") : t("creerCompte")}
        </BoutonAuth>
      </form>

      {/* La mention est ici à sa place : c'est une création de compte, le
          moment où l'on accepte réellement des conditions. */}
      <MentionsAuth />
    </CarteAuth>
  );
}
