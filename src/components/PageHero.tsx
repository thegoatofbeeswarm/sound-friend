import type { ReactNode } from "react";
import { Coil } from "@/components/brand/Coil";

/**
 * The opening of every inner page. One system, four layouts, chosen by what
 * the page is for:
 *
 * - `stage`   learning pages: title on white, a pale teal stage at the right
 *             (corner rounded like the coil) holding the page's picture.
 * - `plate`   history and method pages: the photograph leads at the left.
 * - `band`    tools and personal data: a compact teal band, with room at the
 *             right for a live readout.
 * - `article` long reads: a narrow journal column with the coil in the margin.
 */
export function PageHero({
  title,
  lede,
  children,
  figure,
  variant = "stage",
  compact = false,
}: {
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  figure?: ReactNode;
  variant?: "stage" | "plate" | "band" | "article";
  compact?: boolean;
}) {
  const copy = (
    <>
      <h1 className="rise" style={{ animationDelay: "0ms" }}>
        {title}
      </h1>
      {lede ? (
        <p className="page-hero-lede rise" style={{ animationDelay: "80ms" }}>
          {lede}
        </p>
      ) : null}
      {children ? (
        <div className="page-hero-actions rise" style={{ animationDelay: "160ms" }}>
          {children}
        </div>
      ) : null}
    </>
  );

  if (variant === "plate") {
    return (
      <header className="page-hero page-hero-plate-layout">
        <div className="page-hero-plate-frame">{figure}</div>
        <div className="page-hero-plate-copy">{copy}</div>
      </header>
    );
  }

  if (variant === "band") {
    return (
      <header className="page-hero-band">
        <Coil className="page-hero-band-coil" />
        <div className="page-hero-band-inner">
          <div className="page-hero-band-copy">{copy}</div>
          {figure ? <div className="page-hero-band-figure rise" style={{ animationDelay: "200ms" }}>{figure}</div> : null}
        </div>
      </header>
    );
  }

  if (variant === "article") {
    return (
      <header className="page-hero-article">
        <div className="page-hero-article-inner">
          <Coil className="page-hero-article-coil" />
          <div>{copy}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="page-hero" data-compact={compact ? "" : undefined}>
      <div className="page-hero-copy">{copy}</div>
      <div className="page-hero-stage" aria-hidden={figure ? undefined : true}>
        <Coil className="page-hero-coil" />
        {figure ? <div className="page-hero-figure">{figure}</div> : null}
      </div>
    </header>
  );
}
