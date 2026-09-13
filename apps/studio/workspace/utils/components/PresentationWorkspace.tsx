import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { IDocumentConfirmation } from "../../../../../tools/studio/workspace/document";
import { MarkdownDocument } from "./ArtifactBrowser";
import { ConfirmationBadge } from "./DocumentStatus";
import { PresentationPdfDownload } from "./PresentationPdfDownload";
import { ArtifactFrame } from "../media/ArtifactFrame";
import type { IPresentationSlide } from "./ProjectPresentation";

interface IPresentationWorkspaceValue {
  name: string;
  fileName: string;
  content: Record<string, unknown>;
}

interface IPresentationWorkspaceProps extends IPresentationWorkspaceValue {
  confirmation: IDocumentConfirmation;
  dataSourcePath: string;
  children: ReactNode;
}

interface IPresentationReviewProps {
  slides: readonly IPresentationSlide[];
  width: number;
  height: number;
  selectedIndex?: number;
  formatSlideText?: (slide: IPresentationSlide, index: number) => string;
}

const PresentationContext = createContext<IPresentationWorkspaceValue | null>(
  null,
);

export function usePresentationWorkspace() {
  return useContext(PresentationContext);
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Common slide vocabulary; custom decks may provide an explicit slide.text or formatter. */
export function presentationSlideMarkdown(value: unknown): string | undefined {
  const source = record(value);
  if (!source) return undefined;
  if (typeof source.text === "string") return source.text;
  const heading =
    typeof source.title === "string" ? source.title : source.label;
  if (typeof heading !== "string") return undefined;
  const parts = [`# ${heading}`];
  if (typeof source.eyebrow === "string") parts.push(source.eyebrow);
  else if (typeof source.label === "string" && source.label !== heading)
    parts.push(source.label);
  for (const key of ["summary", "lead", "body"]) {
    if (typeof source[key] === "string") parts.push(source[key]);
  }
  if (Array.isArray(source.points)) {
    for (const point of source.points) {
      if (typeof point === "string") parts.push(`- ${point}`);
      else {
        const item = record(point);
        if (!item) continue;
        if (typeof item.title === "string") parts.push(`## ${item.title}`);
        const detail = item.detail ?? item.text;
        if (typeof detail === "string") parts.push(detail);
      }
    }
  }
  const action = record(source.action);
  if (typeof action?.label === "string") {
    parts.push(
      typeof action.href === "string"
        ? `[${action.label}](${action.href})`
        : action.label,
    );
    if (typeof action.detail === "string") parts.push(action.detail);
  }
  return parts.join("\n\n");
}

export function resolvePresentationSlideText(
  slide: IPresentationSlide,
  index: number,
  content: Record<string, unknown>,
  formatter?: IPresentationReviewProps["formatSlideText"],
): string | undefined {
  if (slide.text !== undefined) return slide.text;
  if (formatter) return formatter(slide, index);
  const candidates = Array.isArray(content.slides) ? content.slides : [];
  const source = candidates.find((item) => record(item)?.id === slide.id);
  return presentationSlideMarkdown(source);
}

/** This shell is shared by inherited and product-owned startup decks. */
export function PresentationWorkspace({
  name,
  fileName,
  content,
  confirmation,
  dataSourcePath,
  children,
}: IPresentationWorkspaceProps) {
  const context = useMemo(
    () => ({ name, fileName, content }),
    [name, fileName, content],
  );
  return (
    <PresentationContext.Provider value={context}>
      <section aria-label={`${name} presentation workspace`}>
        <header className="space-y-3 border-b border-slate-200 px-5 py-7 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Presentation
            </h2>
            <ConfirmationBadge confirmation={confirmation} />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Review the presentation and download the complete deck as PDF.
          </p>
        </header>
        <PresentationPdfDownload fileName={`${fileName}.pdf`} title={name}>
          {children}
        </PresentationPdfDownload>
        <p className="break-all border-t border-slate-200 px-5 py-5 text-xs text-slate-500 md:px-8">
          Source: {dataSourcePath}
        </p>
      </section>
    </PresentationContext.Provider>
  );
}

export function PresentationReview({
  slides,
  width,
  height,
  selectedIndex,
  formatSlideText,
}: IPresentationReviewProps) {
  const workspace = usePresentationWorkspace();
  const [selectedId, setSelectedId] = useState(slides[selectedIndex ?? 0]?.id);
  const [mode, setMode] = useState<"text" | "preview">("text");
  const index = Math.max(
    0,
    slides.findIndex((slide) => slide.id === selectedId),
  );
  const selected = slides[index];
  const exportDeck = useMemo(
    () => (
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none absolute -left-[100000px] top-0"
        data-presentation-pdf-deck="true"
      >
        {slides.map((slide) => (
          <section
            key={slide.id}
            data-slide-id={slide.id}
            style={{ width, height }}
            className="overflow-hidden bg-white"
          >
            {slide.content}
          </section>
        ))}
      </div>
    ),
    [slides, width, height],
  );
  if (!workspace)
    throw new Error("PresentationReview requires PresentationWorkspace.");
  if (!selected)
    return <p className="p-8 text-slate-600">No slides have been added.</p>;
  const text = resolvePresentationSlideText(
    selected,
    index,
    workspace.content,
    formatSlideText,
  );
  return (
    <div>
      {exportDeck}
      <div className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Presentation slides"
          className="border-b border-slate-200 p-4 md:border-b-0 md:border-r"
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Slides
          </p>
          <ol className="space-y-1">
            {slides.map((slide, slideIndex) => (
              <li key={slide.id}>
                <button
                  type="button"
                  aria-current={slide.id === selected.id ? "page" : undefined}
                  onClick={() => setSelectedId(slide.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left text-sm leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${slide.id === selected.id ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <span className="mr-2 text-xs tabular-nums">
                    {String(slideIndex + 1).padStart(2, "0")}
                  </span>
                  {slide.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <section
          aria-label={`Slide ${index + 1}: ${selected.label}`}
          className="min-w-0"
        >
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-8">
            <h3 className="text-lg font-semibold">
              {String(index + 1).padStart(2, "0")} · {selected.label}
            </h3>
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
              aria-label="Slide representation"
            >
              {(
                [
                  { id: "text", label: "Text" },
                  { id: "preview", label: "Layout" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                  className={`rounded-md px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${mode === item.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>
          {mode === "text" ? (
            <article className="px-5 py-7 md:px-8">
              {text !== undefined ? (
                <MarkdownDocument>{text}</MarkdownDocument>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Text is not provided for this slide. Add text from the
                  presentation source through the slide's text formatter.
                </p>
              )}
            </article>
          ) : (
            <div className="p-4 md:p-6">
              <ArtifactFrame
                width={width}
                height={height}
                fileName={`${workspace.fileName}-${String(index + 1).padStart(2, "0")}-${selected.id}.png`}
              >
                <div
                  data-slide-id={selected.id}
                  style={{ width, height }}
                  className="overflow-hidden bg-white"
                >
                  {selected.content}
                </div>
              </ArtifactFrame>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
