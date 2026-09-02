import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ProgressPoint {
  date: string;
  accuracy: number;
  level: number;
  quietestDb: number | null;
}

export function TrainingProgress({ points }: { points: ProgressPoint[] }) {
  const data = points.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--muted-foreground)" tickLine={false} />
          <YAxis
            yAxisId="acc"
            domain={[0, 100]}
            stroke="var(--muted-foreground)"
            tickLine={false}
            width={40}
          />
          <YAxis
            yAxisId="lvl"
            orientation="right"
            domain={[1, 10]}
            stroke="var(--muted-foreground)"
            tickLine={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
            }}
          />
          <Line
            yAxisId="acc"
            type="monotone"
            dataKey="accuracy"
            name="Accuracy %"
            stroke="var(--signal)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="lvl"
            type="monotone"
            dataKey="level"
            name="Difficulty reached"
            stroke="var(--caution)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
