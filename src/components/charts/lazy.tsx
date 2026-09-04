import { Suspense, lazy, type ComponentProps } from "react";
import type { Audiogram as AudiogramType } from "@/components/Audiogram";
import type { TrainingProgress as TrainingProgressType } from "@/components/TrainingProgress";
import type { ScoreTrend as ScoreTrendType } from "./ScoreTrend";
import type { AgreementScatter as AgreementScatterType } from "./AgreementScatter";

// Charts pull in a large plotting library. Loading them on demand keeps the
// first page load small; a placeholder holds the space until they arrive.
function ChartFallback({ className = "h-64" }: { className?: string }) {
  return <div className={`w-full animate-pulse rounded-xl bg-muted/40 ${className}`} />;
}

const AudiogramInner = lazy(() =>
  import("@/components/Audiogram").then((m) => ({ default: m.Audiogram })),
);
const TrainingProgressInner = lazy(() =>
  import("@/components/TrainingProgress").then((m) => ({ default: m.TrainingProgress })),
);
const ScoreTrendInner = lazy(() => import("./ScoreTrend").then((m) => ({ default: m.ScoreTrend })));
const AgreementScatterInner = lazy(() =>
  import("./AgreementScatter").then((m) => ({ default: m.AgreementScatter })),
);

export function Audiogram(props: ComponentProps<typeof AudiogramType>) {
  return (
    <Suspense fallback={<ChartFallback className="h-80" />}>
      <AudiogramInner {...props} />
    </Suspense>
  );
}

export function TrainingProgress(props: ComponentProps<typeof TrainingProgressType>) {
  return (
    <Suspense fallback={<ChartFallback className="h-72" />}>
      <TrainingProgressInner {...props} />
    </Suspense>
  );
}

export function ScoreTrend(props: ComponentProps<typeof ScoreTrendType>) {
  return (
    <Suspense fallback={<ChartFallback className="h-full" />}>
      <ScoreTrendInner {...props} />
    </Suspense>
  );
}

export function AgreementScatter(props: ComponentProps<typeof AgreementScatterType>) {
  return (
    <Suspense fallback={<ChartFallback className="h-full" />}>
      <AgreementScatterInner {...props} />
    </Suspense>
  );
}
