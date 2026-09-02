/** Listening-device presets used for calibration, risk math and coaching. */

export type DeviceId = "over-ear" | "on-ear" | "in-ear";

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
};

export const DEVICES: DevicePreset[] = [
  {
    id: "over-ear",
    label: "Over-ear",
    hint: "Cups surround the whole ear",
    maxOutputDb: 100,
    calibrationOffsetDb: 0,
    isolation: "high",
  },
  {
    id: "on-ear",
    label: "On-ear",
    hint: "Pads rest on top of the ear",
    maxOutputDb: 103,
    calibrationOffsetDb: 2,
    isolation: "medium",
  },
  {
    id: "in-ear",
    label: "In-ear",
    hint: "Earbuds or tips inside the ear canal",
    maxOutputDb: 110,
    calibrationOffsetDb: 6,
    isolation: "low",
  },
];

export const DEFAULT_DEVICE: DeviceId = "over-ear";
const STORAGE_KEY = "audible.device";

export function getDevice(id: string | null | undefined): DevicePreset {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0]!;
}

export function loadDevice(): DeviceId {
  if (typeof window === "undefined") return DEFAULT_DEVICE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (DEVICES.find((d) => d.id === stored)?.id ?? DEFAULT_DEVICE) as DeviceId;
}

export function saveDevice(id: DeviceId) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
}
