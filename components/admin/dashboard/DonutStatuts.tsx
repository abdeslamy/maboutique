"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import type { StatutCommande } from "@/lib/types";

// Palette cohérente avec PastilleStatut (mêmes tons)
const COULEURS: Record<StatutCommande, string> = {
  en_attente: "#f59e0b", // amber-500
  confirmee: "#0ea5e9", // sky-500
  en_livraison: "#8b5cf6", // violet-500
  livree: "#10b981", // emerald-500
  annulee: "#ef4444", // red-500
};

const ORDRE: StatutCommande[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

export default function DonutStatuts({
  parStatut,
}: {
  parStatut: Record<StatutCommande, number>;
}) {
  const t = useTranslations("admin.commandes");
  const total = Object.values(parStatut).reduce((s, v) => s + v, 0);

  const data = ORDRE.filter((s) => parStatut[s] > 0).map((s) => ({
    name: t(`statuts.${s}`),
    value: parStatut[s],
    couleur: COULEURS[s],
    statut: s,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t("titre")}
        </h3>
        <p className="text-xs text-gray-500">
          {t("total", { count: total })}
        </p>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          {t("aucuneCommande")}
        </p>
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[160px_1fr]">
          {/* Donut */}
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.statut} fill={entry.couleur} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Légende */}
          <ul className="flex flex-col gap-1.5 text-sm">
            {data.map((d) => {
              const pct = Math.round((d.value / total) * 100);
              return (
                <li
                  key={d.statut}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.couleur }}
                    />
                    <span className="text-gray-700">{d.name}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {d.value}{" "}
                    <span className="text-xs text-gray-400">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
