import { PhoneCall, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * 2 taux clés en barres de progression :
 *  - Taux de confirmation d'appel (parmi les commandes appelées)
 *  - Taux de livraison réussie (livrée / livrée + annulée)
 */
export default function TauxCles({
  tauxConfirmationAppel,
  tauxLivraisonReussie,
}: {
  tauxConfirmationAppel: number;
  tauxLivraisonReussie: number;
}) {
  const t = useTranslations("admin.dashboard");

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">{t("tauxCles")}</h3>

      <BarreTaux
        icon={<PhoneCall className="h-4 w-4" />}
        libelle={t("tauxConfirmation")}
        valeur={tauxConfirmationAppel}
        couleurBar="bg-sky-500"
        couleurIcon="text-sky-600 bg-sky-50"
      />
      <BarreTaux
        icon={<Truck className="h-4 w-4" />}
        libelle={t("tauxLivraison")}
        valeur={tauxLivraisonReussie}
        couleurBar="bg-emerald-500"
        couleurIcon="text-emerald-600 bg-emerald-50"
      />
    </div>
  );
}

function BarreTaux({
  icon,
  libelle,
  valeur,
  couleurBar,
  couleurIcon,
}: {
  icon: React.ReactNode;
  libelle: string;
  valeur: number;
  couleurBar: string;
  couleurIcon: string;
}) {
  const pct = Math.round(valeur * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${couleurIcon}`}
        >
          {icon}
        </span>
        <span className="flex-1 text-sm text-gray-700">{libelle}</span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${couleurBar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
