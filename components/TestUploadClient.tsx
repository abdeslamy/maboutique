"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Upload, Trash2 } from "lucide-react";

/**
 * Widget d'upload Cloudinary.
 *
 * - CldUploadWidget est un composant officiel next-cloudinary.
 * - Il ouvre une modale hébergée par Cloudinary (glisser-déposer,
 *   choix depuis Google Drive/Dropbox, webcam, capture d'écran...).
 * - Au succès, on récupère la "secure_url" (URL HTTPS de l'image) et
 *   on l'ajoute à la liste.
 *
 * Pour la brique 3 (vraie interface produits), on récupérera ces URLs
 * et on les enverra à notre API pour les stocker dans la table Produit,
 * colonne `images: String[]`.
 */

// Type minimal de ce qui nous intéresse dans la réponse de Cloudinary
type CloudinaryUploadInfo = {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
};

export default function TestUploadClient() {
  const [urls, setUrls] = useState<string[]>([]);

  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!preset) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET manquant dans .env.local.
        </p>
      </section>
    );
  }

  function retirer(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        Test upload Cloudinary
      </h1>
      <p className="mb-8 text-gray-600">
        Page temporaire pour vérifier que le pipeline d&apos;upload fonctionne.
        À la brique 3, ce widget sera intégré au formulaire de création de produit.
      </p>

      {/* Bouton qui ouvre le widget Cloudinary */}
      <CldUploadWidget
        uploadPreset={preset}
        options={{
          sources: ["local", "url", "camera"],
          multiple: true,
          maxFiles: 5,
          clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
          maxFileSize: 5_000_000, // 5 MB
        }}
        onSuccess={(result) => {
          if (typeof result.info === "object" && result.info !== null) {
            const info = result.info as CloudinaryUploadInfo;
            if (info.secure_url) {
              setUrls((prev) => [...prev, info.secure_url]);
            }
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" />
            Uploader une image
          </button>
        )}
      </CldUploadWidget>

      {/* Aperçu des images uploadées */}
      {urls.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            {urls.length} image{urls.length > 1 ? "s" : ""} uploadée
            {urls.length > 1 ? "s" : ""}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {urls.map((url) => (
              <div
                key={url}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <div className="flex items-start justify-between gap-2 p-3">
                  <p className="break-all text-xs text-gray-500">{url}</p>
                  <button
                    type="button"
                    onClick={() => retirer(url)}
                    className="shrink-0 rounded-full p-1.5 text-red-600 transition hover:bg-red-50"
                    aria-label="Retirer de la liste"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            💡 Le bouton 🗑 retire l&apos;image de cette liste, mais elle reste
            présente sur Cloudinary. On gérera la suppression réelle à la brique 3.
          </p>
        </div>
      )}
    </section>
  );
}
