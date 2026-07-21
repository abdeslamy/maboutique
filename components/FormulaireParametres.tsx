"use client";

import { useRef, useState } from "react";
import { Camera, Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import BoutonRetour from "./BoutonRetour";

/**
 * Page paramètres : 3 sections (photo, nom, mot de passe).
 *
 * Pour la photo : on redimensionne dans le navigateur avant l'upload.
 *  1. L'utilisateur choisit un fichier.
 *  2. On le charge dans un <img>.
 *  3. On le redessine dans un <canvas> à 256×256 max.
 *  4. canvas.toDataURL("image/jpeg", 0.85) → base64 ~20 KB.
 *  5. On envoie cette chaîne base64 à l'API.
 * Pas de stockage de fichier nécessaire. Limite : pas adapté à plein d'images,
 * mais parfait pour un avatar dans un montage d'apprentissage.
 */
export default function FormulaireParametres() {
  const t = useTranslations("parametres");
  const { utilisateur, rafraichirUtilisateur } = useAuth();

  // États du formulaire NOM + PHOTO
  const [nom, setNom] = useState(utilisateur?.nom ?? "");
  const [image, setImage] = useState<string | undefined>(utilisateur?.image);
  const [enregistrementInfos, setEnregistrementInfos] = useState(false);
  const [succesInfos, setSuccesInfos] = useState(false);
  const [erreurInfos, setErreurInfos] = useState<string | null>(null);
  const inputFichierRef = useRef<HTMLInputElement | null>(null);

  // États du formulaire MOT DE PASSE
  const [mdpActuel, setMdpActuel] = useState("");
  const [mdpNouveau, setMdpNouveau] = useState("");
  const [mdpConfirme, setMdpConfirme] = useState("");
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [succesMdp, setSuccesMdp] = useState(false);
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);

  if (!utilisateur) {
    return null; // la page parent redirige déjà — sécurité supplémentaire
  }

  // ── Sélection d'un fichier image → redimensionnement → base64 ────────
  async function choisirImage(file: File) {
    setErreurInfos(null);
    if (!file.type.startsWith("image/")) {
      setErreurInfos("image_invalide");
      return;
    }
    try {
      const base64 = await redimensionnerEnBase64(file, 256, 0.85);
      setImage(base64);
      setSuccesInfos(false);
    } catch {
      setErreurInfos("image_invalide");
    }
  }

  // ── Sauvegarde NOM + PHOTO ────────────────────────────────────────────
  async function enregistrerInfos(e: React.FormEvent) {
    e.preventDefault();
    setErreurInfos(null);
    setSuccesInfos(false);
    setEnregistrementInfos(true);

    try {
      const body: { nom?: string; image?: string | null } = {};
      if (nom.trim() !== utilisateur!.nom) body.nom = nom.trim();
      if (image !== utilisateur!.image) body.image = image ?? null;

      if (Object.keys(body).length === 0) {
        setErreurInfos("aucun_changement");
        return;
      }

      const res = await fetch("/api/auth/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreurInfos(data.erreur ?? "erreur_serveur");
        return;
      }
      rafraichirUtilisateur({
        nom: data.utilisateur.nom,
        image: data.utilisateur.image,
      });
      setSuccesInfos(true);
    } catch {
      setErreurInfos("erreur_serveur");
    } finally {
      setEnregistrementInfos(false);
    }
  }

  // ── Changement de mot de passe ────────────────────────────────────────
  async function changerMdp(e: React.FormEvent) {
    e.preventDefault();
    setErreurMdp(null);
    setSuccesMdp(false);

    if (mdpNouveau.length < 8) {
      setErreurMdp("mot_de_passe_court");
      return;
    }
    if (mdpNouveau !== mdpConfirme) {
      setErreurMdp("confirmation_differente");
      return;
    }

    setEnregistrementMdp(true);
    try {
      const res = await fetch("/api/auth/profil/mot-de-passe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actuel: mdpActuel, nouveau: mdpNouveau }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreurMdp(data.erreur ?? "erreur_serveur");
        return;
      }
      setSuccesMdp(true);
      setMdpActuel("");
      setMdpNouveau("");
      setMdpConfirme("");
    } catch {
      setErreurMdp("erreur_serveur");
    } finally {
      setEnregistrementMdp(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <BoutonRetour href="/compte" />
      </div>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight">{t("titre")}</h1>

      {/* ─── Section : Photo + Nom ─────────────────────────────────────── */}
      <form
        onSubmit={enregistrerInfos}
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("infosTitre")}
        </h2>

        <div className="mb-6 flex items-center gap-4">
          <Avatar nom={nom || "?"} image={image} taille="lg" />
          <div className="flex flex-col gap-2">
            <input
              ref={inputFichierRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) choisirImage(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputFichierRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:text-black"
            >
              <Camera className="h-4 w-4" />
              {t("changerPhoto")}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(undefined)}
                className="inline-flex items-center gap-2 self-start text-xs text-red-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("supprimerPhoto")}
              </button>
            )}
          </div>
        </div>

        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("nom")}</span>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        <label className="mb-4 flex flex-col gap-1 text-sm opacity-70">
          <span className="font-medium text-gray-700">{t("email")}</span>
          <input
            type="email"
            value={utilisateur.email}
            disabled
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-500"
          />
          <span className="text-xs text-gray-500">{t("emailNonModifiable")}</span>
        </label>

        {succesInfos && (
          <p
            role="status"
            className="mb-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700"
          >
            <Check className="h-4 w-4" /> {t("infosEnregistrees")}
          </p>
        )}
        {erreurInfos && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {t(`erreurs.${erreurInfos}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={enregistrementInfos}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {enregistrementInfos ? t("enregistrement") : t("enregistrer")}
        </button>
      </form>

      {/* ─── Section : Mot de passe ───────────────────────────────────── */}
      <form
        onSubmit={changerMdp}
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("mdpTitre")}
        </h2>
        <p className="mb-4 text-sm text-gray-600">{t("mdpAide")}</p>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("mdpActuel")}</span>
          <input
            type="password"
            value={mdpActuel}
            onChange={(e) => setMdpActuel(e.target.value)}
            autoComplete="current-password"
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("mdpNouveau")}</span>
          <input
            type="password"
            value={mdpNouveau}
            onChange={(e) => setMdpNouveau(e.target.value)}
            autoComplete="new-password"
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">{t("mdpConfirme")}</span>
          <input
            type="password"
            value={mdpConfirme}
            onChange={(e) => setMdpConfirme(e.target.value)}
            autoComplete="new-password"
            required
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:border-black focus:outline-none"
          />
        </label>

        {succesMdp && (
          <p
            role="status"
            className="mb-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700"
          >
            <Check className="h-4 w-4" /> {t("mdpModifie")}
          </p>
        )}
        {erreurMdp && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {t(`erreurs.${erreurMdp}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={enregistrementMdp}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {enregistrementMdp ? t("enregistrement") : t("changerMdp")}
        </button>
      </form>
    </section>
  );
}

/**
 * Redimensionne une image en base64 :
 *  - charge le fichier dans un <img>
 *  - dessine dans un <canvas> à tailleMax x tailleMax max (en gardant le ratio)
 *  - exporte en JPEG base64 avec une qualité donnée
 *
 * Retourne une "data URL" (string commençant par "data:image/jpeg;base64,...").
 */
async function redimensionnerEnBase64(
  file: File,
  tailleMax = 256,
  qualite = 0.85
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  // Calcul des dimensions cibles en gardant le ratio.
  let { width, height } = img;
  if (width > height) {
    if (width > tailleMax) {
      height = Math.round((height * tailleMax) / width);
      width = tailleMax;
    }
  } else if (height > tailleMax) {
    width = Math.round((width * tailleMax) / height);
    height = tailleMax;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", qualite);
}
