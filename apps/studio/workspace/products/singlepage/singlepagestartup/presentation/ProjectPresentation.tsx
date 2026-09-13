import type { CSSProperties } from "react";
import "../../../../styles/singlepage.css";

import { ProjectPresentation } from "../../../../utils/components/ProjectPresentation";
import { presentationSlideMarkdown } from "../../../../utils/components/PresentationWorkspace";
import type {
  IProjectPresentationData,
  IProjectPresentationSlide,
} from "./types";

function paletteValue(
  data: IProjectPresentationData,
  role: keyof IProjectPresentationData["visual"]["palette"],
): string {
  return `var(--workspace-brand-${role}, ${data.visual.palette[role]})`;
}

function slideStyle(data: IProjectPresentationData): CSSProperties {
  return {
    backgroundColor: paletteValue(data, "surface"),
    color: paletteValue(data, "foreground"),
    fontFamily: `var(--workspace-brand-font-body, ${data.visual.bodyType})`,
  };
}

function Slide({
  data,
  slide,
  index,
}: {
  data: IProjectPresentationData;
  slide: IProjectPresentationSlide;
  index: number;
}) {
  const headingStyle = {
    fontFamily: `var(--workspace-brand-font-display, ${data.visual.displayType})`,
  };
  return (
    <main
      className="flex h-full flex-col px-16 py-10"
      data-workspace-projection={data.projection}
      style={slideStyle(data)}
    >
      <header className="flex items-center justify-between border-b border-black/15 pb-5">
        <img
          className="h-10 w-auto max-w-72"
          src={data.logo}
          alt="SinglePageStartup"
        />
        <span className="text-sm uppercase tracking-widest text-black/60">
          {data.name} · {String(index + 1).padStart(2, "0")} /{" "}
          {data.slides.length}
        </span>
      </header>
      <div
        className={`grid min-h-0 flex-1 items-center gap-14 py-10 ${slide.image ? "grid-cols-[1.15fr_0.85fr]" : "grid-cols-1"}`}
        data-slide-content="true"
      >
        <div>
          <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest">
            <span
              className="h-3 w-3 bg-[var(--workspace-brand-accent,#BFEF61)]"
              aria-hidden="true"
            />
            {slide.eyebrow}
          </p>
          <h1
            className="mt-5 max-w-6xl text-6xl leading-none font-semibold tracking-tight"
            style={headingStyle}
          >
            {slide.title}
          </h1>
          <p className="mt-6 max-w-6xl text-[22px] leading-relaxed text-black/70">
            {slide.summary}
          </p>
          <div
            className={`mt-8 grid gap-5 ${slide.image ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {slide.points.map((point) => (
              <article
                className="border-l-2 border-[var(--workspace-brand-accent,#BFEF61)] pl-5"
                key={point.title}
              >
                <h2 className="text-xl font-semibold">{point.title}</h2>
                <p className="mt-2 text-lg leading-relaxed text-black/65">
                  {point.detail}
                </p>
              </article>
            ))}
          </div>
          {slide.action ? (
            <div className="mt-8">
              <a
                className="inline-flex rounded-lg bg-[#111111] px-6 py-4 text-lg text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                href={slide.action.href}
              >
                {slide.action.label} ↗
              </a>
              <p className="mt-3 text-base text-black/65">
                {slide.action.detail}
              </p>
            </div>
          ) : null}
        </div>
        {slide.image ? (
          <figure className="flex h-full max-h-[600px] items-center justify-center overflow-hidden rounded-2xl bg-[var(--workspace-brand-background,#F7F6F2)]">
            <img
              className="max-h-full w-full object-contain"
              src={slide.image.src}
              alt={slide.image.alt}
            />
          </figure>
        ) : null}
      </div>
      <footer
        className="flex items-center justify-between border-t border-black/15 pt-4 text-sm text-black/60"
        data-slide-footer="true"
      >
        <span>{data.name}</span>
        <span>{slide.eyebrow}</span>
      </footer>
    </main>
  );
}

export default function CodeFrameworkPresentation({
  content: data,
}: {
  content: IProjectPresentationData;
}) {
  return (
    <ProjectPresentation
      name={data.name}
      slides={data.slides.map((slide, index) => ({
        id: slide.id,
        label: slide.eyebrow || slide.title,
        text: presentationSlideMarkdown(slide),
        content: <Slide data={data} slide={slide} index={index} />,
      }))}
    />
  );
}
