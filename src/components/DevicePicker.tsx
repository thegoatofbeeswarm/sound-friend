import { AlertTriangle, BadgeCheck, Headphones } from "lucide-react";
import { DEVICES, DEVICE_GROUPS, getDevice, type DeviceId } from "@/lib/devices";

export function DevicePicker({
  value,
  onChange,
  className,
}: {
  value: DeviceId;
  onChange: (id: DeviceId) => void;
  className?: string;
}) {
  const selected = getDevice(value);

  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Headphones className="h-4 w-4 text-signal" /> What are you listening with?
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Every headphone has its own frequency response, so the model you pick calibrates both the
        test tones and your volume ceiling.
      </p>

      {DEVICE_GROUPS.map((group) => {
        const items = DEVICES.filter((d) => d.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {items.map((d) => {
                const active = d.id === value;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChange(d.id)}
                    aria-pressed={active}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-signal/60 bg-signal/10"
                        : "border-border/70 bg-card/50 hover:border-border"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1.5 text-sm font-medium ${active ? "text-signal" : ""}`}
                    >
                      {d.label}
                      {d.calibrated ? (
                        <BadgeCheck className="h-3.5 w-3.5 text-signal" aria-label="Calibrated" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{d.hint}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      peaks ~{d.maxOutputDb} dB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selected.calibrated ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-signal/40 bg-signal/5 p-3 text-xs text-muted-foreground">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
          <span>
            <strong className="text-foreground">Calibration profile applied.</strong> Tones are
            corrected for the typical response of the {selected.label}, so absolute thresholds are
            more trustworthy.
          </span>
        </p>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-caution/40 bg-caution/5 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
          <span>
            <strong className="text-foreground">Uncalibrated headphones.</strong> We only assume a
            generic {selected.hint.toLowerCase()} response. Results still track relative changes
            over time, but absolute thresholds may be off by several dB.
          </span>
        </p>
      )}
    </div>
  );
}
