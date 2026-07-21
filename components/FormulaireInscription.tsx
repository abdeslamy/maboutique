"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Formulaire d'inscription : nom, email, mot de passe + confirmation.
 *
 * Pédagogie :
 *  - Validation côté client : feedback immédiat à l'utilisateur (UX).
 *  - Validation côté serveur (dans l'API Route) : SEULE vraie protection
 *    car le client peut être contourné.
 *  - On envoie une requête POST en JSON via fetch().
 *  - L'API répond avec un code HTTP et un objet JSON.
 *  - Selon le code, on affiche un message d'erreur ou un message de succès.
 */
export default function FormulaireInscription() {
  const t = useTranslations("inscription");

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Clé de traduction de l'erreur en cours (ex : "mot_de_passe_court")
  const [cleErreur, setCleErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setCleErreur(null);

    // ── Validation côté client ─────────────────────────────────────────
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

    // ── Envoi à l'API ───────────────────────────────────────────────────
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

  // ── Vue "succès" ──────────────────────────────────────────────────────
  if (succes) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-20 text-center">
        <p className="text-6xl" aria-hidden="true">
          ✅
        </p>
        <h1 className="text-2xl font-semibold">{t("succesTitre")}</h1>
        <p className="text-gray-600">{t("succesMessage")}</p>
        <Link
          href="/connexion"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("seConnecter")}
        </Link>
      </section>
    );
  }

  // ── Formulaire ───────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        {t("titre")}
      </h1>
      <p className="mb-8 text-gray-600">{t("sousTitre")}</p>

      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <Champ
          label={t("nom")}
          type="text"
          value={nom}
          onChange={setNom}
          autoComplete="name"
        />
        <Champ
          label={t("email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Champ
          label={t("motDePasse")}
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          aide={t("motDePasseAide")}
        />
        <Champ
          label={t("confirmation")}
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />

        {/* Erreur (rouge, comme spécifié) */}
        {cleErreur && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {t(`erreurs.${cleErreur}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {chargement ? t("creation") : t("creerCompte")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t("dejaInscrit")}{" "}
        <Link href="/connexion" className="font-medium text-black underline">
          {t("seConnecter")}
        </Link>
      </p>
    </section>
  );
}

// Petit composant local pour factoriser un champ label + input + aide.
function Champ({
  label,
  type,
  value,
  onChange,
  autoComplete,
  aide,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  aide?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
      />
      {aide && <span className="text-xs text-gray-500">{aide}</span>}
    </label>
  );
}
