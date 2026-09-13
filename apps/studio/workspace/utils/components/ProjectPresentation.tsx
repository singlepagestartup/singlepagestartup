import type { ReactNode } from "react";
import {
  PresentationReview,
  usePresentationWorkspace,
} from "./PresentationWorkspace";

export interface IPresentationSlide {
  id: string;
  label: string;
  content: ReactNode;
  text?: string;
}

interface IProjectPresentationProps {
  name: string;
  slides: readonly IPresentationSlide[];
  width?: number;
  height?: number;
  formatSlideText?: (slide: IPresentationSlide, index: number) => string;
}

export function requestedSlideIndex(
  search: string,
  count: number,
): number | undefined {
  const requested = new URLSearchParams(search).get("slide");
  if (requested === null || requested.trim() === "") return undefined;
  const index = Number(requested);
  return Number.isInteger(index) && index >= 0 && index < count
    ? index
    : undefined;
}

/** Shared layout and export surface. Each product supplies its own content. */
export function ProjectPresentation({
  name,
  slides,
  width = 1600,
  height = 900,
  formatSlideText,
}: IProjectPresentationProps) {
  const workspace = usePresentationWorkspace();
  const selected = requestedSlideIndex(
    typeof window === "undefined" ? "" : window.location.search,
    slides.length,
  );
  const visible = selected === undefined ? slides : [slides[selected]];
  if (workspace)
    return (
      <PresentationReview
        slides={slides}
        width={width}
        height={height}
        selectedIndex={selected}
        formatSlideText={formatSlideText}
      />
    );
  return (
    <div
      className="m-0 grid justify-start bg-black print:block print:bg-white"
      aria-label={`${name} presentation`}
      data-presentation-ready="true"
      data-slide-count={slides.length}
    >
      <style>{`@page { size: ${width}px ${height}px; margin: 0; }`}</style>
      {visible.map((slide, offset) => (
        <section
          aria-label={`Slide ${(selected ?? offset) + 1}: ${slide.label}`}
          className="overflow-hidden break-after-page bg-white last:break-after-auto"
          style={{ width, height }}
          data-slide-id={slide.id}
          key={slide.id}
        >
          {slide.content}
        </section>
      ))}
    </div>
  );
}
