import { AlertTriangle, BadgeCheck, Headphones } from "lucide-react";
import { DEVICES, DEVICE_GROUPS, getDevice, type DeviceId } from "@/lib/devices";
import { useI18n } from "@/lib/i18n";

/**
 * Headphone choice. A known model gets an estimated level offset taken from
 * published measurements of that model; it is not an acoustic calibration of
 * the listener's own headphones, and it sets no personal volume limit.
 */
export function DevicePicker({
  value,
  onChange,
  className,
}: {
  value: DeviceId;
  onChange: (id: DeviceId) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const selected = getDevice(value);
  const hint = (id: DeviceId, fallback: string) => {
    const key = `device.hint.${id}`;
    const text = t(key);
    return text === key ? fallback : text;
  };

  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Headphones className="h-4 w-4 text-signal" /> {t("device.question")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{t("device.desc")}</p>

      {DEVICE_GROUPS.map((group) => {
        const items = DEVICES.filter((d) => d.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">{t(`home.cta.group.${group}`)}</p>
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
                        <BadgeCheck className="h-3.5 w-3.5 text-signal" aria-label={t("device.calibratedAria")} />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{hint(d.id, d.hint)}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t("device.peaks").replace("{db}", String(d.maxOutputDb))}
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
            <strong className="text-foreground">{t("device.calibratedNote")}</strong>{" "}
            {t("device.calibratedDetail").replace("{device}", selected.label)}
          </span>
        </p>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-caution/40 bg-caution/5 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
          <span>
            <strong className="text-foreground">{t("device.uncalibratedNote")}</strong>{" "}
            {t("device.uncalibratedDetail").replace("{hint}", hint(selected.id, selected.hint).toLowerCase())}
          </span>
        </p>
      )}
    </div>
  );
}
