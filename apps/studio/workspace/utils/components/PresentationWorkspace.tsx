import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PresentationPdfDownload } from "./PresentationPdfDownload";
import { ArtifactFrame } from "../media/ArtifactFrame";
import type { IPresentationSlide } from "./ProjectPresentation";

interface IPresentationWorkspaceValue {
  name: string;
  fileName: string;
}

interface IPresentationWorkspaceProps extends IPresentationWorkspaceValue {
  hideHeader?: boolean;
  children: ReactNode;
}

interface IPresentationReviewProps {
  slides: readonly IPresentationSlide[];
  width: number;
  height: number;
  selectedIndex?: number;
}

const PresentationContext = createContext<IPresentationWorkspaceValue | null>(
  null,
);

export function usePresentationWorkspace() {
  return useContext(PresentationContext);
}

/** This shell is shared by inherited and product-owned startup decks. */
export function PresentationWorkspace({
  name,
  fileName,
  children,
  hideHeader = false,
}: IPresentationWorkspaceProps) {
  const context = useMemo(() => ({ name, fileName }), [name, fileName]);
  return (
    <PresentationContext.Provider value={context}>
      <section aria-label={`${name} — рабочая область презентации`}>
        {!hideHeader && (
          <header className="space-y-3 border-b border-[var(--workspace-brand-line)] px-5 py-7 md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Презентация
              </h2>
            </div>
            <p className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
              Проверьте презентацию и скачайте все слайды в PDF.
            </p>
          </header>
        )}
        <PresentationPdfDownload fileName={`${fileName}.pdf`} title={name}>
          {children}
        </PresentationPdfDownload>
      </section>
    </PresentationContext.Provider>
  );
}

export function PresentationReview({
  slides,
  width,
  height,
}: IPresentationReviewProps) {
  const workspace = usePresentationWorkspace();
  if (!workspace)
    throw new Error("PresentationReview требует PresentationWorkspace.");
  if (!slides.length) return <p className="p-8">Слайды пока не добавлены.</p>;
  return (
    <div
      data-presentation-pdf-deck
      className="divide-y divide-[var(--workspace-brand-line)]"
    >
      {slides.map((slide, index) => (
        <section
          key={slide.id}
          aria-label={`Слайд ${index + 1}: ${slide.label}`}
          className="min-w-0 p-4 md:p-6"
        >
          <h3 className="mb-5 text-lg font-semibold">
            {String(index + 1).padStart(2, "0")} · {slide.label}
          </h3>
          <ArtifactFrame
            width={width}
            height={height}
            fileName={`${workspace.fileName}-${String(index + 1).padStart(2, "0")}-${slide.id}.png`}
          >
            <div
              data-slide-id={slide.id}
              style={{ width, height }}
              className="overflow-hidden bg-white"
            >
              {slide.content}
            </div>
          </ArtifactFrame>
        </section>
      ))}
    </div>
  );
}
