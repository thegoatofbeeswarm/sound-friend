import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pair } from "@/lib/validation";

export function AgreementScatter({
  pairs,
  clinicLabel,
  appLabel,
}: {
  pairs: Pair[];
  clinicLabel: string;
  appLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          dataKey="clinicDb"
          name={clinicLabel}
          unit=" dB"
          tick={{ fontSize: 12 }}
        />
        <YAxis type="number" dataKey="appDb" name={appLabel} unit=" dB" tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: 100, y: 100 },
          ]}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
        <Scatter data={pairs} fill="hsl(var(--signal))" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default AgreementScatter;
