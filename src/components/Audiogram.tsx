import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FREQUENCIES, type ThresholdResult } from "@/lib/audiometry";
import { useI18n } from "@/lib/i18n";

const Y_TICKS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

export function Audiogram({ points }: { points: ThresholdResult[] }) {
  const { t } = useI18n();
  const data = FREQUENCIES.map((f) => ({
    frequency: f,
    label: f >= 1000 ? `${f / 1000}k` : `${f}`,
    left: points.find((p) => p.ear === "left" && p.frequency === f)?.thresholdDb ?? null,
    right: points.find((p) => p.ear === "right" && p.frequency === f)?.thresholdDb ?? null,
  }));

  return (
    <div className="w-full">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 20, bottom: 36, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <ReferenceArea y1={-10} y2={20} fill="var(--signal)" fillOpacity={0.07} />
            <ReferenceArea y1={20} y2={35} fill="var(--caution)" fillOpacity={0.07} />
            <ReferenceArea y1={35} y2={90} fill="var(--danger)" fillOpacity={0.07} />
            <XAxis
              dataKey="label"
              stroke="var(--muted-foreground)"
              tickLine={false}
              tickMargin={8}
              padding={{ left: 12, right: 12 }}
              label={{
                value: t("chart.frequencyHz"),
                position: "insideBottom",
                offset: -24,
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <YAxis
              reversed
              domain={[-10, 90]}
              ticks={Y_TICKS}
              interval={0}
              stroke="var(--muted-foreground)"
              tickLine={false}
              tickMargin={6}
              width={64}
              label={{
                value: t("chart.hearingLevel"),
                angle: -90,
                position: "insideLeft",
                offset: 4,
                style: { textAnchor: "middle" },
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
              }}
              labelFormatter={(l) => t("chart.hz").replace("{v}", String(l))}
              formatter={(v, name) => [
                v == null ? "-" : t("chart.dbHl").replace("{v}", String(v)),
                name as string,
              ]}
            />
            <Legend verticalAlign="top" height={28} iconType="plainline" />
            <Line
              type="monotone"
              dataKey="left"
              name={t("chart.leftEar")}
              stroke="var(--left-ear)"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="right"
              name={t("chart.rightEar")}
              stroke="var(--right-ear)"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("chart.audiogramHelp")}</p>
    </div>
  );
}

