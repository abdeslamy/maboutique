"use client";

import { useState, useMemo } from "react";
import { Search, Check, Truck, Store, Gift, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { WILAYAS } from "@/lib/wilayas";
// livraison-calcul est sans Prisma : importable depuis un composant client.
import type { TarifWilaya, ParametresLivraison } from "@/lib/livraison-calcul";
import type { Locale } from "@/i18n/routing";

/**
 * Réglages de livraison.
 *
 * Le vrai problème d'ergonomie ici : 58 wilayas × 2 tarifs = 116 champs.
 * Trois choses rendent ça praticable :
 *   1. une RECHERCHE pour isoler une wilaya,
 *   2. une APPLICATION EN MASSE sur les lignes affichées (donc filtrables),
 *   3. une barre de sauvegarde FLOTTANTE qui ne s'affiche que s'il y a des
 *      modifications, et qui annonce combien.
 *
 * On n'envoie au serveur que les lignes réellement modifiées.
 */

type Props = {
  tarifsInitiaux: TarifWilaya[];
  parametresInitiaux: ParametresLivraison;
};

export default function ConfigurationLivraison({
  tarifsInitiaux,
  parametresInitiaux,
}: Props) {
  const t = useTranslations("admin.livraison");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [tarifs, setTarifs] = useState<TarifWilaya[]>(tarifsInitiaux);
  const [parametres, setParametres] =
    useState<ParametresLivraison>(parametresInitiaux);
  const [recherche, setRecherche] = useState("");
  const [masseDomicile, setMasseDomicile] = useState("");
  const [masseStopdesk, setMasseStopdesk] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const nomWilaya = useMemo(
    () => new Map(WILAYAS.map((w) => [w.code, w.nom[locale]])),
    [locale]
  );

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return tarifs;
    return tarifs.filter((tr) => {
      const nom = (nomWilaya.get(tr.wilaya) ?? "").toLowerCase();
      return nom.includes(q) || tr.wilaya.includes(q);
    });
  }, [tarifs, recherche, nomWilaya]);

  // Lignes réellement différentes de l'état initial.
  const modifies = useMemo(() => {
    const init = new Map(tarifsInitiaux.map((x) => [x.wilaya, x]));
    return tarifs.filter((x) => {
      const i = init.get(x.wilaya);
      return (
        !i ||
        i.prixDomicile !== x.prixDomicile ||
        i.prixStopdesk !== x.prixStopdesk ||
        i.actif !== x.actif
      );
    });
  }, [tarifs, tarifsInitiaux]);

  const parametresModifies =
    parametres.seuilLivraisonGratuite !==
      parametresInitiaux.seuilLivraisonGratuite ||
    parametres.delaiMin !== parametresInitiaux.delaiMin ||
    parametres.delaiMax !== parametresInitiaux.delaiMax;

  const aDesModifications = modifies.length > 0 || parametresModifies;
  const nbNonDesservies = tarifs.filter((x) => !x.actif).length;

  function majTarif(wilaya: string, champ: keyof TarifWilaya, valeur: unknown) {
    setTarifs((prev) =>
      prev.map((x) => (x.wilaya === wilaya ? { ...x, [champ]: valeur } : x))
    );
    setMessage(null);
  }

  /** Applique les tarifs saisis en masse aux SEULES lignes affichées. */
  function appliquerEnMasse() {
    const d = masseDomicile === "" ? null : Number(masseDomicile);
    const s = masseStopdesk === "" ? null : Number(masseStopdesk);
    if (d === null && s === null) return;
    const codes = new Set(affiches.map((x) => x.wilaya));
    setTarifs((prev) =>
      prev.map((x) =>
        codes.has(x.wilaya)
          ? {
              ...x,
              prixDomicile: d !== null && d >= 0 ? d : x.prixDomicile,
              prixStopdesk: s !== null && s >= 0 ? s : x.prixStopdesk,
            }
          : x
      )
    );
    setMasseDomicile("");
    setMasseStopdesk("");
    setMessage(null);
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/livraison", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Envoi partiel : uniquement les lignes touchées.
        body: JSON.stringify({ tarifs: modifies, parametres }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "erreur_serveur");
        return;
      }
      setMessage("enregistre");
      router.refresh();
    } catch {
      setErreur("erreur_serveur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pb-28">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t("sousTitre")}</p>
      </header>

      {/* ═══ Règles générales ═══════════════════════════════════════ */}
      <section className="mb-6 rounded-3xl bg-stone-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          {t("sectionGeneral")}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Seuil de gratuité */}
          <div className="rounded-2xl bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100">
                <Gift className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-gray-900">
                {t("seuilGratuite")}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={parametres.seuilLivraisonGratuite ?? ""}
                onChange={(e) => {
                  setParametres((p) => ({
                    ...p,
                    seuilLivraisonGratuite:
                      e.target.value === "" ? null : Number(e.target.value),
                  }));
                  setMessage(null);
                }}
                placeholder="—"
                className="w-40 rounded-xl bg-stone-50 px-4 py-2.5 text-lg font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-500">DA</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t("seuilGratuiteAide")}
            </p>
          </div>

          {/* Délai annoncé */}
          <div className="rounded-2xl bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100">
                <Clock className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-gray-900">
                {t("delai")}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">{t("de")}</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={parametres.delaiMin}
                onChange={(e) => {
                  setParametres((p) => ({
                    ...p,
                    delaiMin: Number(e.target.value),
                  }));
                  setMessage(null);
                }}
                className="w-20 rounded-xl bg-stone-50 px-3 py-2.5 text-center text-lg font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-500">{t("a")}</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={parametres.delaiMax}
                onChange={(e) => {
                  setParametres((p) => ({
                    ...p,
                    delaiMax: Number(e.target.value),
                  }));
                  setMessage(null);
                }}
                className="w-20 rounded-xl bg-stone-50 px-3 py-2.5 text-center text-lg font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-500">
                {t("jours")}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t("delaiAide")}</p>
          </div>
        </div>
      </section>

      {/* ═══ Tarifs par wilaya ══════════════════════════════════════ */}
      <section className="rounded-3xl bg-stone-50 p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {t("sectionTarifs")}
          </h2>
          <p className="text-sm text-gray-500">{t("sectionTarifsAide")}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">
            {nbNonDesservies === 0
              ? t("toutesDesservies")
              : t("nonDesservies", { n: nbNonDesservies })}
          </p>
        </div>

        {/* Recherche */}
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("rechercher")}
            className="w-full rounded-full bg-white py-3 ps-11 pe-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Application en masse */}
        <div className="mt-4 rounded-2xl bg-white p-5">
          <p className="text-sm font-medium text-gray-900">
            {t("appliquerToutes")}
          </p>
          <p className="mt-1 text-xs text-gray-500">{t("appliquerAide")}</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">
                {t("domicile")}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={masseDomicile}
                onChange={(e) => setMasseDomicile(e.target.value)}
                placeholder="—"
                className="w-28 rounded-xl bg-stone-50 px-3 py-2 text-sm font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">
                {t("stopdesk")}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={masseStopdesk}
                onChange={(e) => setMasseStopdesk(e.target.value)}
                placeholder="—"
                className="w-28 rounded-xl bg-stone-50 px-3 py-2 text-sm font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
            </label>
            <button
              type="button"
              onClick={appliquerEnMasse}
              disabled={masseDomicile === "" && masseStopdesk === ""}
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {t("appliquer")}
              {recherche ? ` (${affiches.length})` : ""}
            </button>
          </div>
        </div>

        {/* Liste des wilayas */}
        {affiches.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            {t("aucunResultat")}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white">
            {/* En-têtes — masqués sur mobile, où chaque ligne devient une carte */}
            <div className="hidden items-center gap-4 px-5 py-3 text-xs font-medium text-gray-400 sm:flex">
              <span className="flex-1">{t("wilaya")}</span>
              <span className="flex w-28 items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t("domicile")}
              </span>
              <span className="flex w-28 items-center gap-1.5">
                <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t("stopdesk")}
              </span>
              <span className="w-20 text-end">{t("active")}</span>
            </div>

            <ul>
              {affiches.map((tr, i) => (
                <li
                  key={tr.wilaya}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:py-3 ${
                    i > 0 ? "border-t border-stone-100" : ""
                  } ${tr.actif ? "" : "bg-stone-50/60"}`}
                >
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        tr.actif ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      <span className="tabular-nums text-gray-400">
                        {tr.wilaya}
                      </span>{" "}
                      {nomWilaya.get(tr.wilaya)}
                    </p>
                  </div>

                  <div className="flex items-end gap-3 sm:contents">
                    <label className="flex flex-col gap-1 sm:block sm:w-28">
                      <span className="text-xs text-gray-500 sm:hidden">
                        {t("domicile")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        disabled={!tr.actif}
                        value={tr.prixDomicile}
                        onChange={(e) =>
                          majTarif(
                            tr.wilaya,
                            "prixDomicile",
                            Number(e.target.value)
                          )
                        }
                        className="w-24 rounded-lg bg-stone-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900 disabled:text-gray-300 sm:w-full"
                      />
                    </label>

                    <label className="flex flex-col gap-1 sm:block sm:w-28">
                      <span className="text-xs text-gray-500 sm:hidden">
                        {t("stopdesk")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        disabled={!tr.actif}
                        value={tr.prixStopdesk}
                        onChange={(e) =>
                          majTarif(
                            tr.wilaya,
                            "prixStopdesk",
                            Number(e.target.value)
                          )
                        }
                        className="w-24 rounded-lg bg-stone-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-gray-900 disabled:text-gray-300 sm:w-full"
                      />
                    </label>

                    {/* Interrupteur "desservie" */}
                    <div className="ms-auto sm:ms-0 sm:flex sm:w-20 sm:justify-end">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tr.actif}
                        aria-label={`${t("active")} — ${nomWilaya.get(
                          tr.wilaya
                        )}`}
                        onClick={() => majTarif(tr.wilaya, "actif", !tr.actif)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          tr.actif ? "bg-gray-900" : "bg-stone-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                            tr.actif ? "start-[22px]" : "start-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ═══ Barre de sauvegarde flottante ══════════════════════════
          Elle n'apparaît QUE s'il y a quelque chose à sauver, et annonce
          combien de lignes sont concernées — l'admin sait ce qu'il envoie. */}
      {(aDesModifications || message || erreur) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm">
              {erreur ? (
                <span className="font-medium text-red-600">
                  {t.has(`erreurs.${erreur}`)
                    ? t(`erreurs.${erreur}`)
                    : t("erreurs.erreur_serveur")}
                </span>
              ) : message ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                  <Check className="h-4 w-4" strokeWidth={2} />
                  {t("enregistre")}
                </span>
              ) : (
                <span className="text-gray-600">
                  {t("modifiees", {
                    n: modifies.length + (parametresModifies ? 1 : 0),
                  })}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi || !aDesModifications}
              className="shrink-0 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {envoi ? t("enregistrement") : t("enregistrer")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
