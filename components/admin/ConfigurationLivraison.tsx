"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Check,
  Trash2,
  Plus,
  Gift,
  Store,
  Home,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { WILAYAS } from "@/lib/wilayas";
// livraison-calcul est sans Prisma : importable depuis un composant client.
import type { GroupeTarif, ParametresLivraison } from "@/lib/livraison-calcul";
import type { Locale } from "@/i18n/routing";

/**
 * Réglage des prix de livraison, PAR GROUPE de wilayas.
 *
 * Pourquoi des groupes : en Algérie le tarif est quasiment toujours identique
 * par région. Afficher les 58 wilayas revenait à montrer 116 champs pour, en
 * pratique, deux ou trois prix distincts.
 *
 * Ce qu'on affiche donc : uniquement les tarifs déjà créés. Les wilayas se
 * choisissent dans une fenêtre dédiée, ouverte à la demande.
 *
 * Règle de fond : une wilaya présente dans un tarif est livrée, une wilaya
 * absente de tous les tarifs ne l'est pas. Pas d'interrupteur supplémentaire.
 */

/**
 * Brouillon de tarif manipulé dans le formulaire. Les deux prix peuvent être
 * vides pendant la saisie ; seul le stopdesk est obligatoire à l'enregistrement.
 */
type GroupeBrouillon = {
  wilayas: string[];
  prixDomicile: number | null;
  prixStopdesk: number | null;
};

type ErreurGroupe = { stopdesk?: boolean; wilayas?: boolean };

type Props = {
  groupesInitiaux: GroupeTarif[];
  parametresInitiaux: ParametresLivraison;
};

export default function ConfigurationLivraison({
  groupesInitiaux,
  parametresInitiaux,
}: Props) {
  const t = useTranslations("admin.livraison");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [groupes, setGroupes] = useState<GroupeBrouillon[]>(groupesInitiaux);
  // Erreurs de validation, par index de tarif. Vidées dès qu'on corrige.
  const [erreurs, setErreurs] = useState<Record<number, ErreurGroupe>>({});
  const [parametres, setParametres] =
    useState<ParametresLivraison>(parametresInitiaux);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // État de la section « livraison gratuite », indépendant de celui des tarifs.
  const [envoiParams, setEnvoiParams] = useState(false);
  const [messageParams, setMessageParams] = useState<string | null>(null);
  // Index du groupe dont on édite les wilayas ; null = fenêtre fermée.
  const [editionIndex, setEditionIndex] = useState<number | null>(null);

  const nomWilaya = useMemo(
    () => new Map(WILAYAS.map((w) => [w.code, w.nom[locale]])),
    [locale]
  );

  const wilayasCouvertes = useMemo(
    () => new Set(groupes.flatMap((g) => g.wilayas)),
    [groupes]
  );
  const nonLivrees = WILAYAS.filter((w) => !wilayasCouvertes.has(w.code));

  // Deux zones de modification distinctes → deux boutons distincts.
  const groupesModifies =
    JSON.stringify(groupes) !== JSON.stringify(groupesInitiaux);
  const parametresModifies =
    parametres.seuilLivraisonGratuite !==
    parametresInitiaux.seuilLivraisonGratuite;

  function majGroupe(i: number, champ: keyof GroupeBrouillon, valeur: unknown) {
    setGroupes((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, [champ]: valeur } : g))
    );
    setMessage(null);
    setErreurs({});
  }

  function supprimerGroupe(i: number) {
    if (!confirm(t("confirmSupprimer"))) return;
    setGroupes((prev) => prev.filter((_, idx) => idx !== i));
    setMessage(null);
  }

  function ajouterGroupe() {
    // On n ouvre PAS le sélecteur tout de suite : l admin renseigne d abord
    // les prix, puis choisit les wilayas via le bouton de la carte. Le titre
    // du sélecteur peut ainsi rappeler les tarifs en cours de saisie.
    setGroupes((prev) => [
      ...prev,
      { wilayas: [], prixDomicile: null, prixStopdesk: null },
    ]);
    setMessage(null);
    setErreurs({});
  }

  /** Enregistre UNIQUEMENT le seuil de gratuité. */
  async function enregistrerParams() {
    setEnvoiParams(true);
    setMessageParams(null);
    try {
      const res = await fetch("/api/admin/livraison", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Pas de `groupes` dans le corps → les tarifs ne sont pas touchés.
        body: JSON.stringify({ parametres }),
      });
      const data = await res.json();
      setMessageParams(res.ok ? "ok" : data.erreur ?? "erreur_serveur");
      if (res.ok) router.refresh();
    } catch {
      setMessageParams("erreur_serveur");
    } finally {
      setEnvoiParams(false);
    }
  }

  /** Enregistre UNIQUEMENT les tarifs, après validation locale. */
  async function enregistrer() {
    // Un tarif est valide s'il a un prix au bureau ET au moins une wilaya.
    // Le prix à domicile, lui, peut rester vide : cela veut dire « pas de
    // livraison à domicile pour ces wilayas ».
    const trouvees: Record<number, ErreurGroupe> = {};
    groupes.forEach((g, i) => {
      const e: ErreurGroupe = {};
      if (g.prixStopdesk === null) e.stopdesk = true;
      if (g.wilayas.length === 0) e.wilayas = true;
      if (e.stopdesk || e.wilayas) trouvees[i] = e;
    });
    if (Object.keys(trouvees).length > 0) {
      // On signale TOUS les problèmes d'un coup, pas le premier seulement :
      // corriger puis re-soumettre pour découvrir le suivant est pénible.
      setErreurs(trouvees);
      setMessage(null);
      setErreur(null);
      return;
    }

    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    setErreurs({});
    try {
      const res = await fetch("/api/admin/livraison", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupes }),
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
    <div className="pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t("sousTitre")}</p>
      </header>

      {/* ═══ Livraison gratuite — section autonome ══════════════════
          Elle a son PROPRE bouton : l'admin enregistre ce réglage sans
          emporter des tarifs encore en cours d'édition plus bas. */}
      <section className="mb-6 rounded-3xl bg-stone-50 p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Gift className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
          </span>
          <span className="text-[15px] font-medium text-gray-900">
            {t("seuilGratuite")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={parametres.seuilLivraisonGratuite ?? ""}
              onChange={(e) => {
                setParametres({
                  seuilLivraisonGratuite:
                    e.target.value === "" ? null : Number(e.target.value),
                });
                setMessageParams(null);
              }}
              placeholder="—"
              className="w-44 rounded-xl bg-white px-4 py-2.5 text-lg font-semibold tabular-nums text-gray-900 outline-none transition focus:ring-2 focus:ring-gray-900"
            />
            <span className="text-sm font-medium text-gray-500">DA</span>
          </div>

          <button
            type="button"
            onClick={enregistrerParams}
            disabled={envoiParams || !parametresModifies}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {envoiParams ? t("enregistrement") : t("enregistrerSection")}
          </button>

          {messageParams === "ok" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" strokeWidth={2} />
              {t("enregistre")}
            </span>
          )}
          {messageParams && messageParams !== "ok" && (
            <span className="text-sm font-medium text-red-600">
              {t.has(`erreurs.${messageParams}`)
                ? t(`erreurs.${messageParams}`)
                : t("erreurs.erreur_serveur")}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">{t("seuilGratuiteAide")}</p>
      </section>

      {/* ═══ Tarifs (groupes) ═══════════════════════════════════════ */}
      <section className="rounded-3xl bg-stone-50 p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {t("groupes")}
          </h2>
          <p className="text-sm text-gray-500">{t("groupesAide")}</p>
        </div>

        {groupes.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white px-6 py-12 text-center text-sm text-gray-500">
            {t("aucunGroupe")}
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {groupes.map((g, i) => {
              const err = erreurs[i];
              return (
                <article key={i} className="rounded-2xl bg-white p-5">
                  {/* Ligne 1 : wilayas du tarif + suppression */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {t("wilayasDuGroupe", { n: g.wilayas.length })}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {g.wilayas.length === 0
                          ? "—"
                          : g.wilayas
                              .map((w) => nomWilaya.get(w))
                              .filter(Boolean)
                              .join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => supprimerGroupe(i)}
                      aria-label={t("supprimerGroupe")}
                      title={t("supprimerGroupe")}
                      className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  {/* Ligne 2 : bureau à gauche, domicile à droite */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ChampPrix
                      label={t("prixStopdesk")}
                      aide={t("prixStopdeskAide")}
                      Icone={Store}
                      valeur={g.prixStopdesk}
                      enErreur={!!err?.stopdesk}
                      messageErreur={t("erreurStopdesk")}
                      onChange={(v) => majGroupe(i, "prixStopdesk", v)}
                    />
                    <ChampPrix
                      label={t("prixDomicile")}
                      // Vide = pas de livraison à domicile : on le dit ici,
                      // sinon un champ laissé vide passe pour un oubli.
                      aide={t("prixDomicileVide")}
                      Icone={Home}
                      valeur={g.prixDomicile}
                      alignFin
                      onChange={(v) => majGroupe(i, "prixDomicile", v)}
                    />
                  </div>

                  {/* Ligne 3 : accès au choix des wilayas */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setEditionIndex(i)}
                      className={`inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium transition ${
                        err?.wilayas
                          ? "border-red-300 text-red-700 hover:bg-red-50"
                          : "border-gray-300 text-gray-900 hover:bg-stone-100"
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      {g.wilayas.length === 0
                        ? t("ajouterWilayas")
                        : t("modifierWilayas")}
                    </button>
                    {err?.wilayas && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {t("erreurWilayas")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Actions de la section. Sur desktop, "Ajouter" reste a gauche et
            "Enregistrer" est pousse a droite (ms-auto) : action secondaire
            pres du contenu, action principale en bout de ligne.
            Sur mobile, tout s'empile dans l'ordre de lecture. */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={ajouterGroupe}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-stone-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("ajouter")}
          </button>

          <div className="flex flex-wrap items-center gap-3 sm:ms-auto">
            {message && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                <Check className="h-4 w-4" strokeWidth={2} />
                {t("enregistre")}
              </span>
            )}
            {erreur && (
              <span className="text-sm font-medium text-red-600">
                {t.has(`erreurs.${erreur}`)
                  ? t(`erreurs.${erreur}`)
                  : t("erreurs.erreur_serveur")}
              </span>
            )}
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi || !groupesModifies}
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {envoi ? t("enregistrement") : t("enregistrerSection")}
            </button>
          </div>
        </div>

        {/* Rappel des wilayas non couvertes — information, pas alerte.
            On ne liste PLUS les noms : à 55 wilayas, le pavé écrasait le reste
            de la page pour une information qu'on retrouve dans le sélecteur. */}
        <p className="mt-4 text-xs text-gray-500">
          {nonLivrees.length === 0 ? (
            t("toutesLivrees")
          ) : (
            <>
              <span className="font-medium text-gray-700">
                {t("nonLivrees", { n: nonLivrees.length })}
              </span>{" "}
              {t("nonLivreesAide")}
            </>
          )}
        </p>
      </section>

      {/* ═══ Sélecteur de wilayas ═══════════════════════════════════ */}
      {editionIndex !== null && groupes[editionIndex] && (
        <SelecteurWilayas
          selection={groupes[editionIndex].wilayas}
          prixDomicile={groupes[editionIndex].prixDomicile}
          prixStopdesk={groupes[editionIndex].prixStopdesk}
          // Wilayas appartenant aux AUTRES tarifs, avec leur prix actuel.
          // Elles restent sélectionnables : la cocher la DÉPLACE ici, ce qui
          // évite d'obliger l'admin à aller la retirer de l'autre tarif d'abord.
          tarifsAilleurs={
            new Map(
              groupes.flatMap((g, idx) =>
                idx === editionIndex
                  ? []
                  : g.wilayas.map(
                      (w) =>
                        [
                          w,
                          {
                            prixDomicile: g.prixDomicile,
                            prixStopdesk: g.prixStopdesk,
                          },
                        ] as const
                    )
              )
            )
          }
          onAnnuler={() => {
            // Un tarif créé puis abandonné sans wilaya est retiré.
            if (groupes[editionIndex].wilayas.length === 0) {
              setGroupes((prev) => prev.filter((_, i) => i !== editionIndex));
            }
            setEditionIndex(null);
          }}
          onValider={(codes) => {
            const pris = new Set(codes);
            setGroupes((prev) =>
              prev
                .map((g, idx) =>
                  idx === editionIndex
                    ? { ...g, wilayas: codes }
                    : // Les wilayas reprises sont retirées de leur ancien tarif :
                      // une wilaya n'a qu'un seul prix.
                      { ...g, wilayas: g.wilayas.filter((w) => !pris.has(w)) }
                )
                // Un tarif vidé de toutes ses wilayas n'a plus d'objet.
                .filter((g, idx) => idx === editionIndex || g.wilayas.length > 0)
            );
            setMessage(null);
            setEditionIndex(null);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Champ prix
// ────────────────────────────────────────────────────────────────────

function ChampPrix({
  label,
  aide,
  Icone,
  valeur,
  onChange,
  alignFin = false,
  enErreur = false,
  messageErreur,
}: {
  label: string;
  aide: string;
  Icone: typeof Store;
  /** null = champ vide. Pour le domicile, cela signifie « pas de livraison ». */
  valeur: number | null;
  onChange: (v: number | null) => void;
  /** Aligne le contenu en fin de ligne (le champ « domicile », à droite). */
  alignFin?: boolean;
  enErreur?: boolean;
  messageErreur?: string;
}) {
  return (
    <div>
      <label
        className={`block rounded-xl border p-4 transition ${
          enErreur
            ? "border-red-300 bg-red-50/50"
            : "border-transparent bg-stone-50"
        } ${alignFin ? "sm:text-end" : ""}`}
      >
        <span
          className={`flex items-center gap-1.5 ${
            alignFin ? "sm:justify-end" : ""
          }`}
        >
          <span className="text-xs font-medium text-gray-700">{label}</span>
          {/* Icône juste après le libellé, légèrement ombrée. */}
          <Icone
            className="h-4 w-4 shrink-0 text-gray-500 drop-shadow-sm"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <span className="mt-0.5 block text-[11px] text-gray-500">{aide}</span>
        <span
          className={`mt-2 flex items-center gap-2 ${
            alignFin ? "sm:justify-end" : ""
          }`}
        >
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            // Champ vide → null, et non 0 : un prix de 0 voudrait dire
            // « gratuit », pas « indisponible ».
            value={valeur ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="—"
            className={`w-28 rounded-lg bg-white px-3 py-2 text-base font-semibold tabular-nums text-gray-900 outline-none transition focus:ring-2 focus:ring-gray-900 ${
              alignFin ? "sm:text-end" : ""
            }`}
          />
          <span className="text-xs font-medium text-gray-500">DA</span>
        </span>
      </label>
      {enErreur && messageErreur && (
        <p
          className={`mt-1.5 text-xs font-medium text-red-600 ${
            alignFin ? "sm:text-end" : ""
          }`}
        >
          {messageErreur}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Sélecteur de wilayas (fenêtre)
// ────────────────────────────────────────────────────────────────────

function SelecteurWilayas({
  selection,
  tarifsAilleurs,
  prixDomicile,
  prixStopdesk,
  onValider,
  onAnnuler,
}: {
  selection: string[];
  /** Wilayas déjà rattachées à un AUTRE tarif, avec les prix de ce tarif. */
  tarifsAilleurs: Map<
    string,
    { prixDomicile: number | null; prixStopdesk: number | null }
  >;
  /** Prix du tarif en cours d'édition — affichés dans le titre.
      null tant que le champ est vide : le titre montre alors « -- ». */
  prixDomicile: number | null;
  prixStopdesk: number | null;
  onValider: (codes: string[]) => void;
  onAnnuler: () => void;
}) {
  const t = useTranslations("admin.livraison");
  const locale = useLocale() as Locale;
  const [choisies, setChoisies] = useState<Set<string>>(new Set(selection));
  const [recherche, setRecherche] = useState("");

  // Échap ferme, et le fond ne défile plus tant que la fenêtre est ouverte.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onAnnuler();
    }
    document.addEventListener("keydown", surTouche);
    const initial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = initial;
    };
  }, [onAnnuler]);

  const affichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return WILAYAS;
    return WILAYAS.filter(
      (w) => w.nom[locale].toLowerCase().includes(q) || w.code.includes(q)
    );
  }, [recherche, locale]);

  // « Tout sélectionner » agit sur les lignes visibles (aucune n'est bloquée).
  const selectionnables = affichees;
  const toutesChoisies =
    selectionnables.length > 0 &&
    selectionnables.every((w) => choisies.has(w.code));

  function basculer(code: string) {
    setChoisies((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(code)) suivant.delete(code);
      else suivant.add(code);
      return suivant;
    });
  }

  function basculerToutes() {
    setChoisies((prev) => {
      const suivant = new Set(prev);
      for (const w of selectionnables) {
        if (toutesChoisies) suivant.delete(w.code);
        else suivant.add(w.code);
      }
      return suivant;
    });
  }

  // `selection` ne change pas tant que la fenêtre est ouverte : c'est donc
  // l'état d'origine, celui vers lequel « réinitialiser » ramène.
  function reinitialiser() {
    setChoisies(new Set(selection));
    setRecherche("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("annuler")}
        onClick={onAnnuler}
        className="absolute inset-0 h-full w-full cursor-default bg-gray-900/40"
      />

      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white sm:max-h-[80vh] sm:max-w-lg sm:rounded-3xl">
        {/* En-tête : le TITRE seul, comme la référence Klarna. Ni croix ni
            lien — la sortie se fait par les commandes du bas, par Échap, ou
            par un clic sur le voile. Les deux prix rappellent en permanence
            quel tarif on est en train de composer. */}
        <div className="px-6 pt-7">
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[22px] font-semibold tracking-tight text-gray-900">
            <span>{t("tarifsTitre")}</span>
            <span className="inline-flex items-center gap-1.5">
              <Store
                className="h-[18px] w-[18px] text-gray-400"
                strokeWidth={1.75}
              />
              {prixStopdesk === null ? t("nonRenseigne") : prixStopdesk + " DA"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Home
                className="h-[18px] w-[18px] text-gray-400"
                strokeWidth={1.75}
              />
              {prixDomicile === null ? t("nonRenseigne") : prixDomicile + " DA"}
            </span>
          </h2>
        </div>

        {/* Recherche */}
        <div className="relative mt-5 px-6">
          <Search
            className="pointer-events-none absolute start-9 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("rechercher")}
            className="w-full rounded-full bg-stone-50 py-2.5 ps-10 pe-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Tout sélectionner : une VRAIE case à cocher, du même style que
            celles de la liste. L'ancien lien souligné ne se lisait pas comme
            une action. */}
        <div className="px-6 pt-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-stone-50">
            <input
              type="checkbox"
              checked={toutesChoisies}
              onChange={basculerToutes}
              disabled={selectionnables.length === 0}
              className="h-4 w-4 shrink-0 accent-gray-900"
            />
            <span className="text-sm font-medium text-gray-900">
              {toutesChoisies ? t("toutDeselectionner") : t("toutSelectionner")}
            </span>
          </label>

          {/* La règle du déplacement vient APRÈS la case : on lit d'abord
              l'action, ensuite sa conséquence. */}
          <p className="mt-2 px-2 text-xs leading-relaxed text-gray-500">
            {t("deplacementAide")}
          </p>
        </div>

        {/* Liste */}
        <div className="mt-2 flex-1 overflow-y-auto px-6 py-2">
          <ul className="flex flex-col">
            {affichees.map((w) => {
              const ailleurs = tarifsAilleurs.get(w.code);
              const cochee = choisies.has(w.code);
              return (
                <li key={w.code}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={cochee}
                      onChange={() => basculer(w.code)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-gray-900"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-gray-900">
                        <span className="tabular-nums text-gray-400">
                          {w.code}
                        </span>{" "}
                        {w.nom[locale]}
                      </span>
                      {/* Wilaya déjà rattachée ailleurs : on affiche SON tarif
                          actuel, pour que l'admin sache ce qu'il déplace. */}
                      {ailleurs && !cochee && (
                        <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">
                          {t("dejaDansTarif", {
                            // Un prix absent s'affiche « -- » plutôt que
                            // de faire échouer l'interpolation.
                            domicile:
                              ailleurs.prixDomicile ?? t("nonRenseigne"),
                            stopdesk:
                              ailleurs.prixStopdesk ?? t("nonRenseigne"),
                          })}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Actions : « Valider » en pleine largeur, puis retour et
            réinitialiser aux deux extrémités. L'action principale domine,
            les secondaires restent atteignables au pouce. */}
        <div className="border-t border-stone-100 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={() => onValider([...choisies])}
            className="w-full rounded-full bg-gray-900 py-3.5 text-[15px] font-medium text-white transition hover:bg-gray-700"
          >
            {t("valider")} ({choisies.size})
          </button>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={onAnnuler}
              aria-label={t("retour")}
              title={t("retour")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-stone-100 hover:text-gray-900"
            >
              {/* Miroir en RTL : « retour » suit le sens de lecture. */}
              <ArrowLeft
                className="h-5 w-5 rtl:-scale-x-100"
                strokeWidth={1.75}
              />
            </button>

            <button
              type="button"
              onClick={reinitialiser}
              aria-label={t("reinitialiser")}
              title={t("reinitialiser")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-stone-100 hover:text-gray-900"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
