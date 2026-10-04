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
      <header className="flex items-center justify-between border-b border-[var(--workspace-brand-line)] pb-5">
        <img
          className="h-10 w-auto max-w-72"
          src={data.logo}
          alt="SinglePageStartup"
        />
        <span className="text-sm text-[var(--workspace-brand-muted)]">
          {data.name} · {String(index + 1).padStart(2, "0")} /{" "}
          {data.slides.length}
        </span>
      </header>
      <div
        className={`grid min-h-0 flex-1 items-center gap-14 py-10 ${slide.image ? "grid-cols-[1.15fr_0.85fr]" : "grid-cols-1"}`}
        data-slide-content="true"
      >
        <div>
          <p className="inline-flex items-center gap-3 text-sm font-semibold">
            <span
              className="h-2 w-8 rounded-full bg-[var(--workspace-brand-accent,#BFEF61)]"
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
          <p className="mt-6 max-w-6xl text-[22px] leading-relaxed text-[var(--workspace-brand-muted)]">
            {slide.summary}
          </p>
          <div
            className={`mt-8 grid gap-5 ${slide.image ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {slide.points.map((point) => (
              <article
                className="rounded-2xl bg-[var(--workspace-brand-background)] p-5"
                key={point.title}
              >
                <h2 className="text-xl font-semibold">{point.title}</h2>
                <p className="mt-2 text-lg leading-relaxed text-[var(--workspace-brand-muted)]">
                  {point.detail}
                </p>
              </article>
            ))}
          </div>
          {slide.action ? (
            <div className="mt-8">
              <a
                className="inline-flex items-center gap-3 rounded-xl bg-[var(--workspace-brand-accent)] px-6 py-4 text-lg font-semibold text-[var(--workspace-brand-foreground)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                href={slide.action.href}
              >
                {slide.action.label}
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-icon-family="phosphor"
                  data-icon-name="arrow-up-right"
                  data-icon-weight="regular"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  className="size-5 shrink-0"
                >
                  <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                </svg>
              </a>
              <p className="mt-3 text-base text-[var(--workspace-brand-muted)]">
                {slide.action.detail}
              </p>
            </div>
          ) : null}
        </div>
        {slide.image ? (
          <figure className="aspect-square w-full max-w-[600px] justify-self-center overflow-hidden rounded-2xl bg-[var(--workspace-brand-background,#F4F6F8)]">
            <img
              className="h-full w-full object-contain"
              src={slide.image.src}
              alt={slide.image.alt}
            />
          </figure>
        ) : null}
      </div>
      <footer
        className="flex items-center justify-between border-t border-[var(--workspace-brand-line)] pt-4 text-sm text-[var(--workspace-brand-muted)]"
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
