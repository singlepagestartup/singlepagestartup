import "../../../../styles/singlepage.css";

import { ProjectPresentation } from "../../../../utils/components/ProjectPresentation";
import { presentationSlideMarkdown } from "../../../../utils/components/PresentationWorkspace";

interface IAIChatSlide {
  id: string;
  label: string;
  title: string;
  lead: string;
  points: string[];
}

interface IAIChatPresentation {
  name: string;
  subtitle: string;
  slides: IAIChatSlide[];
}

function Slide({
  data,
  slide,
  index,
}: {
  data: IAIChatPresentation;
  slide: IAIChatSlide;
  index: number;
}) {
  return (
    <main
      data-workspace-projection="singlepage"
      className="flex h-full flex-col bg-white px-16 py-10 text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--workspace-brand-line)] pb-5">
        <img
          className="h-10 w-auto max-w-72"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
          alt="SinglePageStartup"
        />
        <span className="text-sm text-[var(--workspace-brand-muted)]">
          {data.name} · {String(index + 1).padStart(2, "0")} /{" "}
          {data.slides.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 py-10" data-slide-content="true">
        <p className="inline-flex items-center gap-3 text-sm font-semibold">
          <span
            className="h-2 w-8 rounded-full bg-[var(--workspace-brand-accent,#BFEF61)]"
            aria-hidden="true"
          />
          {slide.label}
        </p>
        <h1 className="mt-5 max-w-6xl text-6xl leading-none font-semibold tracking-tight [font-family:var(--workspace-brand-font-display)]">
          {slide.title}
        </h1>
        <p className="mt-6 max-w-6xl text-[22px] leading-relaxed text-[var(--workspace-brand-muted)]">
          {slide.lead}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-5">
          {slide.points.map((point, pointIndex) => (
            <article
              className="rounded-2xl bg-[var(--workspace-brand-background)] p-5"
              key={point}
            >
              <p className="text-xs text-[var(--workspace-brand-muted)]">
                {String(pointIndex + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xl leading-relaxed text-[var(--workspace-brand-muted)]">
                {point}
              </p>
            </article>
          ))}
        </div>
      </div>
      <footer
        className="flex items-center justify-between border-t border-[var(--workspace-brand-line)] pt-4 text-sm text-[var(--workspace-brand-muted)]"
        data-slide-footer="true"
      >
        <span>{data.subtitle}</span>
        <span>{slide.label}</span>
      </footer>
    </main>
  );
}

export default function AIChatPresentation({
  content: data,
}: {
  content: IAIChatPresentation;
}) {
  return (
    <ProjectPresentation
      name={data.name}
      slides={data.slides.map((slide, index) => ({
        id: slide.id,
        label: slide.label,
        text: presentationSlideMarkdown(slide),
        content: <Slide data={data} slide={slide} index={index} />,
      }))}
    />
  );
}
