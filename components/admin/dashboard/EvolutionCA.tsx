"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { formatPrix } from "@/lib/format";
import type { PointEvolution } from "@/lib/orders";
import type { Locale } from "@/i18n/routing";

/**
 * Évolution du CA (livré) sur les 7 derniers jours.
 * Aire dégradée en émeraude + grille légère.
 */
export default function EvolutionCA({ data }: { data: PointEvolution[] }) {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale() as Locale;
  const total7j = data.reduce((s, d) => s + d.ca, 0);
  const dataAvecLabel = data.map((d) => ({
    ...d,
    _ca: d.ca, // pour le tooltip
  }));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t("evolutionCA")}
        </h3>
        <p className="text-xs text-gray-500">
          {t("evolutionCASousTitre", { total: formatPrix(total7j, locale) })}
        </p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dataAvecLabel}
            margin={{ top: 10, right: 5, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="evolCA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="jour"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "#e5e7eb" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
              formatter={((v: unknown) => [
                formatPrix(typeof v === "number" ? v : Number(v ?? 0), locale),
                t("ca"),
              ]) as never}
              labelFormatter={(l) => String(l)}
            />
            <Area
              type="monotone"
              dataKey="ca"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#evolCA)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
