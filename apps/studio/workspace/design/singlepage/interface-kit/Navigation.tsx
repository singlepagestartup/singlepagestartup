import { Fragment, useId, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Button, Icon, kit, Specimen } from "./primitives";

interface IPaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    detail: "A summary of the project and its current work.",
  },
  {
    id: "materials",
    label: "Materials",
    detail: "Notes, documents and images collected for the project.",
  },
  {
    id: "settings",
    label: "Settings",
    detail: "The project name and its display preferences.",
  },
];

export function CompactNavigation() {
  const navigationId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState("overview");
  const [open, setOpen] = useState(false);
  const current = navigationItems.find((item) => item.id === active)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[var(--workspace-brand-surface)] p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="stack" /> Project
        </span>
        <Button
          ref={menuButtonRef}
          variant="secondary"
          className="sm:hidden"
          aria-expanded={open}
          aria-controls={navigationId}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "x" : "stack"} /> Menu
        </Button>
        <nav
          id={navigationId}
          aria-label="Project navigation example"
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 sm:flex sm:w-auto sm:flex-row`}
        >
          {navigationItems.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={active === item.id ? "page" : undefined}
              className={`min-h-11 rounded-xl px-4 py-2 text-left text-sm font-medium ${kit.focus} ${active === item.id ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]" : `${kit.muted} hover:bg-[var(--workspace-brand-background)]`}`}
              onClick={() => {
                setActive(item.id);
                if (open) menuButtonRef.current?.focus();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            disabled
            className="min-h-11 cursor-not-allowed rounded-xl px-4 py-2 text-left text-sm text-[var(--workspace-brand-muted)] opacity-50"
          >
            Billing
          </button>
        </nav>
      </header>
      <div
        className="border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5"
        aria-live="polite"
      >
        <p className="text-sm font-semibold">{current.label}</p>
        <p className={`mt-2 text-sm leading-6 ${kit.muted}`}>
          {current.detail}
        </p>
      </div>
    </div>
  );
}

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
  label = "Result pages",
}: IPaginationControlsProps) {
  const pages =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, index) => index)
      : [...new Set([0, page - 1, page, page + 1, pageCount - 1])]
          .filter((index) => index >= 0 && index < pageCount)
          .sort((a, b) => a - b);

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        className="px-3"
        disabled={page === 0 || pageCount === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon name="arrow-right" className="rotate-180" />
        <span className="sr-only sm:not-sr-only">Previous</span>
      </Button>
      {pages.map((pageIndex, index) => (
        <Fragment key={pageIndex}>
          {index > 0 && pageIndex - pages[index - 1] > 1 ? (
            <span aria-hidden="true" className={`px-1 text-sm ${kit.muted}`}>
              …
            </span>
          ) : null}
          <Button
            variant={page === pageIndex ? "primary" : "plain"}
            className="min-w-11 px-3"
            aria-label={`Page ${pageIndex + 1}`}
            aria-current={page === pageIndex ? "page" : undefined}
            onClick={() => onPageChange(pageIndex)}
          >
            {pageIndex + 1}
          </Button>
        </Fragment>
      ))}
      <Button
        variant="secondary"
        className="px-3"
        disabled={page >= pageCount - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <span className="sr-only sm:not-sr-only">Next</span>
        <Icon name="arrow-right" />
      </Button>
    </nav>
  );
}

function BreadcrumbExample() {
  const [depth, setDepth] = useState(2);
  const labels = ["Workspace", "Materials", "Project notes"];

  return (
    <div className={kit.card}>
      <nav aria-label="Breadcrumb example">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {labels.slice(0, depth + 1).map((label, index) => (
            <li className="flex min-w-0 items-center gap-2" key={label}>
              {index > 0 ? (
                <Icon name="arrow-right" className={kit.muted} />
              ) : null}
              {index === depth ? (
                <span aria-current="page" className="font-semibold">
                  {label}
                </span>
              ) : (
                <button
                  type="button"
                  className={`min-h-11 rounded-md underline-offset-4 hover:underline ${kit.muted} ${kit.focus}`}
                  onClick={() => setDepth(index)}
                >
                  {label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <p className={`mt-3 text-sm ${kit.muted}`} aria-live="polite">
        Viewing {labels[depth].toLowerCase()}.
      </p>
      <Button
        variant="plain"
        className="mt-3 px-0"
        disabled={depth === 2}
        onClick={() => setDepth(2)}
      >
        Open project notes
      </Button>
    </div>
  );
}

export function NavigationSpecimens() {
  const [page, setPage] = useState(0);
  const publicNavId = useId();

  return (
    <div className="grid min-w-0 gap-4">
      <Specimen
        id="navigation"
        title="Navigation"
        description="Public links identify destinations; workspace navigation keeps the current section visible. The compact menu opens below the header on small screens."
        states={[
          "default",
          "current",
          "keyboard focus",
          "disabled",
          "compact menu open / closed",
        ]}
        usage="Use real destinations in public navigation. This local workspace example switches panels without leaving the specimen; Billing is unavailable. Keep every target at least 44px high."
        recipe="min-h-11 rounded-xl px-4 py-2 text-sm font-medium; current: bg-[var(--workspace-brand-background)]; compact: hidden sm:flex; kit.focus"
      >
        <div className="grid gap-4">
          <nav
            aria-label="Public navigation example"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--workspace-brand-line)] px-4 py-3"
          >
            <span className="text-sm font-semibold">SinglePageStartup</span>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a
                href={`#${publicNavId}-intro`}
                className={`inline-flex min-h-11 items-center rounded-md underline-offset-4 hover:underline ${kit.focus}`}
              >
                Introduction
              </a>
              <a
                href={`#${publicNavId}-usage`}
                className={`inline-flex min-h-11 items-center rounded-md underline-offset-4 hover:underline ${kit.focus}`}
              >
                Usage
              </a>
            </div>
          </nav>
          <div className="grid gap-3 sm:grid-cols-2">
            <p
              id={`${publicNavId}-intro`}
              className={`scroll-mt-6 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-6 ${kit.muted}`}
            >
              <strong className="text-[var(--workspace-brand-foreground)]">
                Introduction.
              </strong>{" "}
              Navigation connects a page to its sections.
            </p>
            <p
              id={`${publicNavId}-usage`}
              className={`scroll-mt-6 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-6 ${kit.muted}`}
            >
              <strong className="text-[var(--workspace-brand-foreground)]">
                Usage.
              </strong>{" "}
              Keep destination names short and specific.
            </p>
          </div>
          <CompactNavigation />
        </div>
      </Specimen>

      <Specimen
        id="tabs"
        title="Tabs"
        description="Tabs switch between related views while keeping the surrounding task in place."
        states={[
          "selected",
          "unselected",
          "hover",
          "keyboard focus",
          "disabled",
        ]}
        usage="Arrow keys, Home and End move across enabled tabs. Tab enters the active panel. Automatic activation suits these immediately available local panels."
        recipe="rounded-lg px-4 py-3 text-sm font-medium; data-[state=active]:bg-[var(--workspace-brand-surface)] data-[state=active]:shadow-sm; disabled:opacity-50; kit.focus"
      >
        <Tabs.Root defaultValue="overview">
          <Tabs.List
            aria-label="Material views"
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--workspace-brand-background)] p-1"
          >
            {[
              { value: "overview", title: "Overview" },
              { value: "activity", title: "Activity" },
              { value: "history", title: "History", disabled: true },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={`rounded-lg px-4 py-3 text-sm font-medium text-[var(--workspace-brand-muted)] data-[state=active]:bg-[var(--workspace-brand-surface)] data-[state=active]:text-[var(--workspace-brand-foreground)] data-[state=active]:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${kit.focus}`}
              >
                {tab.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content
            value="overview"
            className={`mt-3 rounded-xl border border-[var(--workspace-brand-line)] p-5 text-sm leading-6 ${kit.focus}`}
          >
            <p className="font-semibold">Project notes</p>
            <p className={`mt-2 ${kit.muted}`}>
              A place for the decisions and materials you are reviewing.
            </p>
          </Tabs.Content>
          <Tabs.Content
            value="activity"
            className={`mt-3 rounded-xl border border-[var(--workspace-brand-line)] p-5 text-sm leading-6 ${kit.focus}`}
          >
            <p className="font-semibold">Recent activity</p>
            <p className={`mt-2 ${kit.muted}`}>
              Project notes added. A review is waiting for your input.
            </p>
          </Tabs.Content>
        </Tabs.Root>
      </Specimen>

      <Specimen
        id="breadcrumbs"
        title="Breadcrumbs"
        description="A short location trail leads back to the parent level. The current page remains plain text."
        states={[
          "parent destination",
          "current page",
          "keyboard focus",
          "root only",
        ]}
        usage="Label the nav landmark, use an ordered list and aria-current=page on the final item. This local example opens parent levels; the reset action restores the full trail."
        recipe="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm; parent: min-h-11 underline-offset-4 hover:underline; current: font-semibold; kit.focus"
      >
        <BreadcrumbExample />
      </Specimen>

      <Specimen
        id="pagination"
        title="Pagination"
        description="A short page set shows its current position and disables unavailable directions."
        states={[
          "first page",
          "middle page",
          "last page",
          "current page",
          "disabled direction",
          "keyboard focus",
        ]}
        usage="Use buttons when replacing local results. Link to real URLs for independently addressable pages. Large sets show first, last and neighboring pages with gaps; at most seven numbered controls are rendered."
        recipe="flex flex-wrap items-center gap-2; numbered controls: min-w-11 px-3; kit.button / kit.plain / kit.secondary; aria-current=page"
      >
        <div className="grid gap-4">
          <p className={`text-sm ${kit.muted}`} aria-live="polite">
            Showing items {page * 3 + 1}–{page * 3 + 3} of 9
          </p>
          <ol start={page * 3 + 1} className="grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((offset) => (
              <li
                key={page * 3 + offset}
                className="rounded-xl border border-[var(--workspace-brand-line)] p-4 text-sm"
              >
                Material {page * 3 + offset + 1}
              </li>
            ))}
          </ol>
          <PaginationControls
            page={page}
            pageCount={3}
            onPageChange={setPage}
            label="Example material pages"
          />
        </div>
      </Specimen>
    </div>
  );
}

export default NavigationSpecimens;
