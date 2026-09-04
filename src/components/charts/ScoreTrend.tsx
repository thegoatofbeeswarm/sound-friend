import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimelinePoint } from "@/lib/listening-profile";

export function ScoreTrend({
  timeline,
  scoreLabel,
}: {
  timeline: TimelinePoint[];
  scoreLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={timeline} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${v}`, scoreLabel]} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--signal))"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ScoreTrend;
