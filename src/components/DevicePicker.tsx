import { Headphones } from "lucide-react";
import { DEVICES, type DeviceId } from "@/lib/devices";

export function DevicePicker({
  value,
  onChange,
  className,
}: {
  value: DeviceId;
  onChange: (id: DeviceId) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Headphones className="h-4 w-4 text-signal" /> What are you listening with?
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Each type couples sound to your ear differently, so this calibrates both the test tones and
        your safe-volume ceiling.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DEVICES.map((d) => {
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
              <span className={`block text-sm font-medium ${active ? "text-signal" : ""}`}>
                {d.label}
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
}
