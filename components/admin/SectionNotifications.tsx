"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { emailPlausible } from "@/lib/email-valide";

/**
 * Adresse à laquelle le marchand reçoit ses alertes de commande.
 *
 * Section autonome, avec son propre bouton : même principe que le seuil de
 * livraison gratuite juste au-dessus — on enregistre ce réglage sans
 * emporter des tarifs encore en cours d'édition.
 *
 * `emailPlausible` vient de `lib/email-valide.ts` — un fichier PUR, la même
 * fonction que celle utilisée côté serveur. Deux expressions régulières
 * distinctes finiraient par diverger, et le formulaire accepterait ce que
 * l'API refuse. Le fichier est séparé de `lib/boutique.ts`, qui importe
 * Prisma : l'importer ici embarquerait la base dans le navigateur.
 */
export default function SectionNotifications({
  emailInitial,
}: {
  emailInitial: string | null;
}) {
  const t = useTranslations("admin.notifications");
  const router = useRouter();

  const [email, setEmail] = useState(emailInitial ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modifie = email.trim().toLowerCase() !== (emailInitial ?? "").toLowerCase();
  // Erreur DÉRIVÉE de la saisie, jamais stockée : un message figé dans un
  // état survit à la correction et reste affiché à tort.
  const invalide = email.trim() !== "" && !emailPlausible(email);

  async function enregistrer() {
    setEnvoi(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/boutique", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContact: email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMessage(data.erreur ?? "erreur_serveur");
      } else {
        setMessage("ok");
        router.refresh();
      }
    } catch {
      setMessage("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="mb-6 rounded-3xl bg-stone-50 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
          <Bell className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
        </span>
        <span className="text-[15px] font-medium text-gray-900">
          {t("titre")}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(null);
          }}
          placeholder={t("placeholder")}
          aria-label={t("titre")}
          aria-invalid={invalide}
          className={`w-full max-w-sm rounded-full border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
            invalide
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-gray-900"
          }`}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={enregistrer}
            disabled={envoi || !modifie || invalide}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {envoi ? t("enregistrement") : t("enregistrer")}
          </button>

          {message === "ok" && (
            <span className="text-sm text-green-600">{t("enregistre")}</span>
          )}
          {message && message !== "ok" && (
            <span className="text-sm text-red-600">
              {t.has(`erreurs.${message}`)
                ? t(`erreurs.${message}`)
                : t("erreurs.erreur_serveur")}
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {invalide ? t("erreurs.email_invalide") : t("aide")}
      </p>
    </section>
  );
}
