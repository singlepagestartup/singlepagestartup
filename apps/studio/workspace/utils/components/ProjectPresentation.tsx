import type { ReactNode } from "react";

export interface IPresentationSlide {
  id: string;
  label: string;
  content: ReactNode;
}

interface IProjectPresentationProps {
  name: string;
  slides: readonly IPresentationSlide[];
}

/** Shared layout and export surface. Each product supplies its own content. */
export function ProjectPresentation({
  name,
  slides,
}: IProjectPresentationProps) {
  const requested =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("slide");
  const index = requested === null ? undefined : Number(requested);
  const selected =
    index !== undefined &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < slides.length
      ? index
      : undefined;
  const visible = selected === undefined ? slides : [slides[selected]];
  return (
    <div
      className="m-0 grid justify-start bg-black print:block print:bg-white"
      aria-label={`${name} presentation`}
      data-presentation-ready="true"
      data-slide-count={slides.length}
    >
      <style>{"@page { size: 1600px 900px; margin: 0; }"}</style>
      {visible.map((slide, offset) => (
        <section
          aria-label={`Slide ${(selected ?? offset) + 1}: ${slide.label}`}
          className="h-[900px] w-[1600px] overflow-hidden break-after-page bg-white last:break-after-auto"
          data-slide-id={slide.id}
          key={slide.id}
        >
          {slide.content}
        </section>
      ))}
    </div>
  );
}
