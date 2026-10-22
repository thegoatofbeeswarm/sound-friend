import type { CSSProperties } from "react";
import { IMAGES, type ImageName } from "@/lib/images";

/**
 * A photo from public/img served as responsive AVIF, with the original JPEG
 * as the fallback. `sizes` tells the browser how wide the image is drawn so
 * it downloads the smallest file that is still sharp.
 */
export function Picture({
  name,
  alt,
  sizes,
  className,
  style,
  priority = false,
  dataFit,
}: {
  name: ImageName;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /** Above-the-fold images load eagerly and early. */
  priority?: boolean;
  dataFit?: "contain";
}) {
  const img = IMAGES[name];
  const srcSet = img.avif.map((w) => `/img/${name}-${w}.avif ${w}w`).join(", ");
  return (
    <picture style={{ display: "contents" }}>
      <source type="image/avif" srcSet={srcSet} sizes={sizes} />
      <img
        src={`/img/${name}.jpg`}
        width={img.width}
        height={img.height}
        alt={alt}
        className={className}
        style={style}
        data-fit={dataFit}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}
