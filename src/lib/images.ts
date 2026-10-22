/**
 * Responsive versions of the photos in public/img, generated with sharp
 * (AVIF at quality 50 for each listed width; the JPEG is the fallback).
 * Regenerate them after replacing a photo.
 */
export const IMAGES = {
  "gray-head-1860": {
    width: 1313,
    height: 1600,
    avif: [
      400,
      800,
      1200
    ]
  },
  "hughes-audiometer-1879": {
    width: 1600,
    height: 1071,
    avif: [
      400,
      800,
      1200
    ]
  },
  "maico-audiometer-1960s": {
    width: 1147,
    height: 1600,
    avif: [
      400,
      800
    ]
  },
  "tonotopy-chittka-brockmann": {
    width: 1303,
    height: 1600,
    avif: [
      400,
      800,
      1200
    ]
  },
  "tympanic-membrane": {
    width: 1389,
    height: 1400,
    avif: [
      400,
      800,
      1200
    ]
  }
} as const;

export type ImageName = keyof typeof IMAGES;
