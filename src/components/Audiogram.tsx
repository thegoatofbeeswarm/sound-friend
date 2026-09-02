import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FREQUENCIES, type ThresholdResult } from "@/lib/audiometry";

export function Audiogram({ points }: { points: ThresholdResult[] }) {
  const data = FREQUENCIES.map((f) => ({
    frequency: f,
    label: f >= 1000 ? `${f / 1000}k` : `${f}`,
    left: points.find((p) => p.ear === "left" && p.frequency === f)?.thresholdDb ?? null,
    right: points.find((p) => p.ear === "right" && p.frequency === f)?.thresholdDb ?? null,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <ReferenceArea y1={-10} y2={20} fill="var(--signal)" fillOpacity={0.07} />
          <ReferenceArea y1={20} y2={35} fill="var(--caution)" fillOpacity={0.07} />
          <ReferenceArea y1={35} y2={90} fill="var(--danger)" fillOpacity={0.07} />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            tickLine={false}
            label={{ value: "Hz", position: "insideBottomRight", fill: "var(--muted-foreground)" }}
          />
          <YAxis
            reversed
            domain={[-10, 90]}
            stroke="var(--muted-foreground)"
            tickLine={false}
            width={44}
            label={{
              value: "dB HL",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted-foreground)",
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(v, name) => [v == null ? "-" : `${v as number} dB`, name as string]}
          />
          <Line
            type="monotone"
            dataKey="left"
            name="Left ear"
            stroke="var(--left-ear)"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="right"
            name="Right ear"
            stroke="var(--right-ear)"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
