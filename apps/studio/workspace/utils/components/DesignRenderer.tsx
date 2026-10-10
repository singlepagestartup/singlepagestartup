import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  flattenDesignSections,
  type IDesignLayoutView,
  type IDesignSectionView,
  type IDesignTemplateProps,
} from "../design/layout";
import ProjectDesign, { ProjectDesignSection } from "./ProjectDesign";
import { DocumentDownloads } from "./DocumentDownloads";
import { DocumentHeader, documentPurpose } from "./DocumentStatus";
import { WorkspacePage } from "./WorkspacePage";
import type { WorkspacePageLayer } from "../pages";

interface IDesignSectionContentProps {
  section: IDesignSectionView;
  templateProps: IDesignTemplateProps;
  nested?: boolean;
}

interface ICategorySelection {
  id?: string;
  scroll?: "always" | "if-needed";
}

function DesignSectionContent({
  section,
  templateProps,
  nested = false,
}: IDesignSectionContentProps) {
  if (section.builtin)
    return (
      <ProjectDesignSection
        {...templateProps}
        data={templateProps.data!}
        section={section.builtin}
      />
    );
  if (section.children)
    return (
      <DesignSectionGroup section={section} templateProps={templateProps} />
    );
  const Heading = nested ? "h3" : "h2";
  return (
    <section
      id={section.id}
      className={
        nested
          ? "min-w-0 scroll-mt-6"
          : "mx-auto max-w-7xl scroll-mt-6 border-t border-[var(--workspace-brand-line)] px-5 py-12 md:px-10 md:py-16"
      }
    >
      <Heading
        id={`${section.id}-heading`}
        className={
          nested
            ? "mb-6 font-[family-name:var(--workspace-brand-font-display)] text-2xl leading-tight font-semibold tracking-tight md:text-3xl"
            : "mb-8 font-[family-name:var(--workspace-brand-font-display)] text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl"
        }
      >
        {section.title}
      </Heading>
      {section.page ? <WorkspacePage page={section.page} hideTitle /> : null}
    </section>
  );
}

function DesignSectionGroup({
  section,
  templateProps,
}: IDesignSectionContentProps) {
  const descendants = flattenDesignSections(section.children ?? []);
  const categories = descendants.filter((child) => !child.children);
  const [selection, setSelection] = useState<ICategorySelection>({
    id: categories[0]?.id,
  });
  const [showAll, setShowAll] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const selectedId = categories.some((child) => child.id === selection.id)
    ? selection.id
    : categories[0]?.id;

  useLayoutEffect(() => {
    if (!selection.scroll || !selectedId) return;
    const panel = panelsRef.current?.querySelector<HTMLElement>(
      `[data-design-panel="${selectedId}"]`,
    );
    if (!panel || panel.hidden) return;
    const { top } = panel.getBoundingClientRect();
    if (selection.scroll === "always" || top < 24 || top > window.innerHeight)
      panel.scrollIntoView({ block: "start", behavior: "auto" });
  }, [selection, selectedId]);

  useEffect(() => {
    const readHash = () => {
      const selected = descendants.find(
        (child) => child.id === window.location.hash.slice(1),
      );
      if (!selected) return;
      const leaf = selected.children
        ? flattenDesignSections(selected.children).find(
            (child) => !child.children,
          )
        : selected;
      if (leaf) {
        setSelection({ id: leaf.id, scroll: "always" });
        setShowAll(false);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [section]);

  const selectCategory = (id: string) => {
    setSelection({ id, scroll: "if-needed" });
    setShowAll(false);
    window.history.replaceState(null, "", `#${id}`);
  };

  const navigationItems = (children: IDesignSectionView[]): ReactNode =>
    children.map((child) => (
      <li key={child.id} className={child.children ? "w-full" : undefined}>
        {child.children ? (
          <>
            <p className="mb-2 px-3 text-xs font-semibold text-[var(--workspace-brand-muted)]">
              {child.title}
            </p>
            <ul className="flex flex-wrap gap-2 md:flex-col">
              {navigationItems(child.children)}
            </ul>
          </>
        ) : (
          <button
            id={`design-category-${child.id}`}
            type="button"
            data-design-category={child.id}
            aria-pressed={!showAll && selectedId === child.id}
            aria-controls={`design-panel-${child.id}`}
            onClick={() => selectCategory(child.id)}
            onKeyDown={(event) => {
              const current = categories.findIndex(
                (item) => item.id === child.id,
              );
              const offset =
                event.key === "ArrowDown" || event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowUp" || event.key === "ArrowLeft"
                    ? -1
                    : 0;
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? categories.length - 1
                    : offset
                      ? (current + offset + categories.length) %
                        categories.length
                      : undefined;
              if (next === undefined) return;
              event.preventDefault();
              const id = categories[next].id;
              selectCategory(id);
              navigationRef.current
                ?.querySelector<HTMLButtonElement>(
                  `[data-design-category="${id}"]`,
                )
                ?.focus({ preventScroll: true });
            }}
            className="min-h-11 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-left text-sm leading-5 text-[var(--workspace-brand-foreground)] transition-colors hover:border-[var(--workspace-brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-primary)] aria-pressed:border-[var(--workspace-brand-primary)] aria-pressed:bg-[var(--workspace-brand-primary)] aria-pressed:text-[var(--workspace-brand-surface)] md:w-full"
          >
            {child.title ??
              child.id.charAt(0).toUpperCase() + child.id.slice(1)}
          </button>
        )}
      </li>
    ));

  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className="mx-auto max-w-7xl scroll-mt-6 border-t border-[var(--workspace-brand-line)] px-5 py-12 md:px-10 md:py-16"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h2
          id={`${section.id}-heading`}
          className="font-[family-name:var(--workspace-brand-font-display)] text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl"
        >
          {section.title}
        </h2>
        <button
          type="button"
          data-export-controls
          aria-pressed={showAll}
          onClick={() => setShowAll((current) => !current)}
          className="min-h-11 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-sm text-[var(--workspace-brand-foreground)] hover:border-[var(--workspace-brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-primary)] print:hidden"
        >
          {showAll ? "Show one category" : "Show all"}
        </button>
      </div>
      <div className="flex flex-col items-stretch gap-8 md:flex-row md:items-start">
        <nav
          ref={navigationRef}
          aria-label={`${section.title} categories`}
          data-export-controls
          className="md:sticky md:top-6 md:w-48 md:shrink-0 print:hidden"
        >
          <label htmlFor={`${section.id}-category-select`} className="sr-only">
            {section.title} category
          </label>
          <select
            id={`${section.id}-category-select`}
            value={showAll ? "" : selectedId}
            onChange={(event) => selectCategory(event.currentTarget.value)}
            className="min-h-11 w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-base text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-primary)] md:hidden"
          >
            <option value="" disabled>
              All categories
            </option>
            {categories.map((child) => (
              <option key={child.id} value={child.id}>
                {child.title ??
                  child.id.charAt(0).toUpperCase() + child.id.slice(1)}
              </option>
            ))}
          </select>
          <ul className="hidden gap-2 md:flex md:flex-col">
            {navigationItems(section.children ?? [])}
          </ul>
        </nav>
        <div ref={panelsRef} className="min-w-0 flex-1 space-y-12">
          {categories.map((child) => (
            <div
              key={child.id}
              id={`design-panel-${child.id}`}
              data-design-panel={child.id}
              className="scroll-mt-6"
              role="region"
              aria-label={child.title ?? child.id}
              hidden={!showAll && selectedId !== child.id}
            >
              <DesignSectionContent
                section={child}
                templateProps={templateProps}
                nested
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Presentation structure belongs to the selected layout; document data resolves separately. */
export function DesignRenderer({
  layout,
  projection = "default",
  ...props
}: IDesignTemplateProps & {
  layout: IDesignLayoutView;
  projection?: WorkspacePageLayer | "default";
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  // Downloads receive an expanded copy; changing categories never unmounts a
  // specimen or changes the reviewer's selection to prepare the catalogue.
  const downloadRef = {
    get current() {
      const clone = exportRef.current?.cloneNode(true) as
        | HTMLDivElement
        | undefined;
      clone
        ?.querySelectorAll<HTMLElement>("[data-design-panel]")
        .forEach((panel) => {
          panel.hidden = false;
        });
      return clone ?? null;
    },
  };
  if (
    (!layout.Template ||
      flattenDesignSections(layout.sections).some(
        (section) => section.builtin,
      )) &&
    !props.data
  )
    throw new Error("Built-in Design blocks need parsed Design data.");
  const Template = layout.Template;
  const sections = layout.sections.map((section) => (
    <DesignSectionContent
      key={section.id}
      section={section}
      templateProps={props}
    />
  ));
  return (
    <div
      ref={exportRef}
      data-workspace-projection={projection}
      className="min-h-screen font-[family-name:var(--workspace-brand-font-body)] bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] md:p-10"
    >
      <DocumentHeader
        actions={
          <DocumentDownloads
            fileName="Design"
            htmlTargetRef={downloadRef}
            markdown={props.document}
            theme="dark"
            title="Design"
          />
        }
        confirmation={props.confirmation}
        title="Design"
        {...documentPurpose("design")}
      />
      <div className="overflow-clip rounded-3xl border border-[var(--workspace-brand-line)] ">
        {Template ? (
          <Template {...props}>{sections}</Template>
        ) : (
          <ProjectDesign data={props.data!}>{sections}</ProjectDesign>
        )}
      </div>
    </div>
  );
}
