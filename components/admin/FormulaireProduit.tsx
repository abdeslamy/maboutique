"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { slugifier } from "@/lib/slug";
import BoutonRetour from "@/components/BoutonRetour";
import type { Produit, Categorie } from "@/lib/types";

/**
 * Formulaire produit — sert à CRÉER et à MODIFIER.
 *
 * Mode = "creer" :
 *   - Champs vides
 *   - Slug (id) auto-généré depuis nomFr (éditable manuellement)
 *   - Appelle POST /api/admin/produits
 *
 * Mode = "modifier" :
 *   - Champs pré-remplis avec `produit`
 *   - Slug affiché en lecture seule (les URLs restent stables)
 *   - Appelle PATCH /api/admin/produits/[id]
 */

type CloudinaryUploadInfo = { secure_url?: string };
type Mode = "creer" | "modifier";

export default function FormulaireProduit({
  mode,
  produit,
}: {
  mode: Mode;
  produit?: Produit;
}) {
  const t = useTranslations("admin.formulaireProduit");
  const tCat = useTranslations("categories");
  const router = useRouter();

  // ── États des champs ─────────────────────────────────────────────────
  const [nomFr, setNomFr] = useState(produit?.nom.fr ?? "");
  const [nomAr, setNomAr] = useState(produit?.nom.ar ?? "");
  const [descFr, setDescFr] = useState(produit?.description.fr ?? "");
  const [descAr, setDescAr] = useState(produit?.description.ar ?? "");
  const [prix, setPrix] = useState<string>(
    produit ? String(produit.prix) : ""
  );
  const [categorie, setCategorie] = useState<Categorie>(
    produit?.categorie ?? "mode"
  );
  const [emoji, setEmoji] = useState(produit?.emoji ?? "📦");
  const [images, setImages] = useState<string[]>(produit?.images ?? []);
  const [videoUrl, setVideoUrl] = useState(produit?.videoUrl ?? "");
  const [id, setId] = useState(produit?.id ?? "");
  const [idModifieManuellement, setIdModifieManuellement] = useState(false);

  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // ── Auto-slug depuis nomFr en mode création ──────────────────────────
  useEffect(() => {
    if (mode !== "creer") return;
    if (idModifieManuellement) return;
    setId(slugifier(nomFr));
  }, [nomFr, mode, idModifieManuellement]);

  // ── Upload Cloudinary ────────────────────────────────────────────────
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  function ajouterImage(url: string) {
    setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
  }

  function retirerImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  // ── Soumission ───────────────────────────────────────────────────────
  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    // Validation client basique (le serveur revalide tout)
    const prixNum = Number(prix);
    if (nomFr.trim().length < 2) return setErreur("nom_fr_court");
    if (nomAr.trim().length < 2) return setErreur("nom_ar_court");
    if (descFr.trim().length < 5) return setErreur("description_fr_courte");
    if (descAr.trim().length < 5) return setErreur("description_ar_courte");
    if (!Number.isInteger(prixNum) || prixNum < 1)
      return setErreur("prix_invalide");
    if (images.length === 0) return setErreur("images_manquantes");
    if (mode === "creer" && !id) return setErreur("id_invalide");

    setEnvoi(true);
    try {
      const body = {
        id: mode === "creer" ? id : produit!.id,
        nomFr,
        nomAr,
        descriptionFr: descFr,
        descriptionAr: descAr,
        prix: prixNum,
        categorie,
        images,
        emoji,
        videoUrl: videoUrl || undefined,
      };

      const url =
        mode === "creer"
          ? "/api/admin/produits"
          : `/api/admin/produits/${produit!.id}`;
      const method = mode === "creer" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "erreur_serveur");
        return;
      }

      // Succès : retour à la liste
      router.push("/admin/produits");
      router.refresh();
    } catch {
      setErreur("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <BoutonRetour href="/admin/produits" />
      </div>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        {mode === "creer" ? t("titreCreation") : t("titreEdition")}
      </h1>

      <form onSubmit={soumettre} className="flex flex-col gap-6">
        {/* ─── Section : Photos ────────────────────────────────────── */}
        <fieldset className="rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="px-2 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("photos")}
          </legend>

          {/* Galerie des images uploadées */}
          {images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((url) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-xl border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => retirerImage(url)}
                    className="absolute end-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow-sm opacity-0 transition group-hover:opacity-100"
                    aria-label={t("retirerImage")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bouton d'upload */}
          {preset ? (
            <CldUploadWidget
              uploadPreset={preset}
              options={{
                sources: ["local", "url", "camera"],
                multiple: true,
                maxFiles: 8,
                clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
                maxFileSize: 5_000_000,
              }}
              onSuccess={(result) => {
                const info = result.info as CloudinaryUploadInfo | undefined;
                if (info?.secure_url) ajouterImage(info.secure_url);
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-black hover:text-black"
                >
                  <Upload className="h-4 w-4" />
                  {images.length === 0 ? t("ajouterPhotos") : t("ajouterAutres")}
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <p className="text-sm text-red-600">
              NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET manquant.
            </p>
          )}

          {images.length === 0 && (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <ImageIcon className="h-3.5 w-3.5" />
              {t("photosAide")}
            </p>
          )}
        </fieldset>

        {/* ─── Section : Bilingue ──────────────────────────────────── */}
        <fieldset className="rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="px-2 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("bilingue")}
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ
              label={t("nomFr")}
              value={nomFr}
              onChange={setNomFr}
              required
            />
            <Champ
              label={t("nomAr")}
              value={nomAr}
              onChange={setNomAr}
              required
              dir="rtl"
            />
            <ZoneTexte
              label={t("descFr")}
              value={descFr}
              onChange={setDescFr}
              required
            />
            <ZoneTexte
              label={t("descAr")}
              value={descAr}
              onChange={setDescAr}
              required
              dir="rtl"
            />
          </div>
        </fieldset>

        {/* ─── Section : Détails ────────────────────────────────────── */}
        <fieldset className="rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="px-2 text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("details")}
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">{t("prix")}</span>
              <div className="flex">
                <input
                  type="number"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  min={1}
                  required
                  className="w-full rounded-s-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
                />
                <span className="rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  DA
                </span>
              </div>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">{t("categorie")}</span>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as Categorie)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
              >
                <option value="mode">{tCat("mode")}</option>
                <option value="electronique">{tCat("electronique")}</option>
                <option value="maison">{tCat("maison")}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">{t("emoji")}</span>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-2xl focus:border-black focus:outline-none"
              />
              <span className="text-xs text-gray-500">{t("emojiAide")}</span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">
                {t("videoUrl")} <span className="text-gray-400">({t("optionnel")})</span>
              </span>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
              />
            </label>

            {mode === "creer" && (
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-gray-700">
                  {t("slug")}{" "}
                  <span className="text-gray-400">({t("slugAide")})</span>
                </span>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    setIdModifieManuellement(true);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-black focus:outline-none"
                />
              </label>
            )}
          </div>
        </fieldset>

        {/* ─── Erreur ──────────────────────────────────────────────── */}
        {erreur && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {t.has(`erreurs.${erreur}`)
              ? t(`erreurs.${erreur}`)
              : t("erreurs.erreur_serveur")}
          </p>
        )}

        {/* ─── Boutons ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={envoi}
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {envoi
              ? t("enregistrement")
              : mode === "creer"
              ? t("creer")
              : t("enregistrer")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/produits")}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm text-gray-700 transition hover:border-black hover:text-black"
          >
            {t("annuler")}
          </button>
        </div>
      </form>
    </section>
  );
}

function Champ({
  label,
  value,
  onChange,
  required,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
      />
    </label>
  );
}

function ZoneTexte({
  label,
  value,
  onChange,
  required,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        rows={3}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
      />
    </label>
  );
}
