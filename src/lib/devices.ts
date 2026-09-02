/** Listening-device presets used for calibration, risk math and coaching. */

export type DeviceId = string;

export type DevicePreset = {
  id: DeviceId;
  label: string;
  hint: string;
  /** Typical SPL at the eardrum at 100% device volume. */
  maxOutputDb: number;
  /**
   * Level correction applied during the screening. Sealed in-ear tips couple
   * more energy to the eardrum than open, distant drivers do.
   */
  calibrationOffsetDb: number;
  /** How well the device blocks room noise, used in coaching notes. */
  isolation: "high" | "medium" | "low";
  /**
   * True when the offset comes from a published response for that specific
   * model. False means we only know the rough form factor, so absolute
   * thresholds carry more uncertainty.
   */
  calibrated: boolean;
  group: "Earbuds" | "Headphones" | "Other";
};

export const DEVICES: DevicePreset[] = [
  {
    id: "airpods-pro-3",
    label: "AirPods Pro 3",
    hint: "Sealed tips, adaptive ANC",
    maxOutputDb: 110,
    calibrationOffsetDb: 6,
    isolation: "high",
    calibrated: true,
    group: "Earbuds",
  },
  {
    id: "airpods-pro-2",
    label: "AirPods Pro 2",
    hint: "Sealed tips, ANC",
    maxOutputDb: 110,
    calibrationOffsetDb: 6,
    isolation: "high",
    calibrated: true,
    group: "Earbuds",
  },
  {
    id: "airpods",
    label: "AirPods (open fit)",
    hint: "Unsealed buds resting in the ear",
    maxOutputDb: 102,
    calibrationOffsetDb: 3,
    isolation: "low",
    calibrated: true,
    group: "Earbuds",
  },
  {
    id: "earpods-wired",
    label: "Wired EarPods",
    hint: "Unsealed wired buds",
    maxOutputDb: 100,
    calibrationOffsetDb: 2,
    isolation: "low",
    calibrated: true,
    group: "Earbuds",
  },
  {
    id: "sony-wh1000xm6",
    label: "Sony WH-1000XM6",
    hint: "Over-ear, strong ANC",
    maxOutputDb: 100,
    calibrationOffsetDb: 1,
    isolation: "high",
    calibrated: true,
    group: "Headphones",
  },
  {
    id: "bose-qc-ultra",
    label: "Bose QuietComfort Ultra",
    hint: "Over-ear, strong ANC",
    maxOutputDb: 100,
    calibrationOffsetDb: 1,
    isolation: "high",
    calibrated: true,
    group: "Headphones",
  },
  {
    id: "over-ear",
    label: "Other over-ear",
    hint: "Cups surround the whole ear",
    maxOutputDb: 100,
    calibrationOffsetDb: 0,
    isolation: "high",
    calibrated: false,
    group: "Other",
  },
  {
    id: "on-ear",
    label: "Other on-ear",
    hint: "Pads rest on top of the ear",
    maxOutputDb: 103,
    calibrationOffsetDb: 2,
    isolation: "medium",
    calibrated: false,
    group: "Other",
  },
  {
    id: "in-ear",
    label: "Other in-ear",
    hint: "Earbuds or tips inside the ear canal",
    maxOutputDb: 110,
    calibrationOffsetDb: 6,
    isolation: "low",
    calibrated: false,
    group: "Other",
  },
];

export const DEVICE_GROUPS = ["Earbuds", "Headphones", "Other"] as const;

export const DEFAULT_DEVICE: DeviceId = "over-ear";
const STORAGE_KEY = "audible.device";

export function getDevice(id: string | null | undefined): DevicePreset {
  const matching = DEVICES.find((d) => d.id === id);
  if (matching) return matching;
  const fallback = DEVICES.find((d) => d.id === DEFAULT_DEVICE) ?? DEVICES[0];
  if (!fallback) throw new Error("No listening devices configured");
  return fallback;
}

export function loadDevice(): DeviceId {
  if (typeof window === "undefined") return DEFAULT_DEVICE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return DEVICES.find((d) => d.id === stored)?.id ?? DEFAULT_DEVICE;
}

export function saveDevice(id: DeviceId) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
}
