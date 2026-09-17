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
    <main className="flex h-full flex-col bg-white px-16 py-10 text-[#111111] [font-family:var(--workspace-brand-font-body)]">
      <header className="flex items-center justify-between border-b border-black/15 pb-5">
        <img
          className="h-10 w-auto max-w-72"
          src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
          alt="SinglePageStartup"
        />
        <span className="text-sm uppercase tracking-widest text-black/60">
          {data.name} · {String(index + 1).padStart(2, "0")} /{" "}
          {data.slides.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 py-10" data-slide-content="true">
        <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest">
          <span
            className="h-3 w-3 bg-[var(--workspace-brand-accent,#BFEF61)]"
            aria-hidden="true"
          />
          {slide.label}
        </p>
        <h1 className="mt-5 max-w-6xl text-6xl leading-none font-semibold tracking-tight [font-family:var(--workspace-brand-font-display)]">
          {slide.title}
        </h1>
        <p className="mt-6 max-w-6xl text-[22px] leading-relaxed text-black/70">
          {slide.lead}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-5">
          {slide.points.map((point, pointIndex) => (
            <article
              className="border-l-2 border-[var(--workspace-brand-accent,#BFEF61)] pl-5"
              key={point}
            >
              <p className="text-xs uppercase tracking-widest text-black/45">
                {String(pointIndex + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xl leading-relaxed text-black/70">
                {point}
              </p>
            </article>
          ))}
        </div>
      </div>
      <footer
        className="flex items-center justify-between border-t border-black/15 pt-4 text-sm text-black/60"
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
