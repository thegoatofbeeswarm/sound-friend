import type { PartId } from "./earScene";

/** one colour per part, shared by the 3D model and the tags and plates around it */
export const PART_COLOR: Record<PartId, string> = {
  outer: "#ff9e7a",
  canal: "#ff7aa8",
  drum: "#ffd36b",
  ossicles: "#f1e4c8",
  cochlea: "#14b8a6",
  nerve: "#f59e0b",
  vestibular: "#6d8cff",
  eustachian: "#7dd3a0",
};
