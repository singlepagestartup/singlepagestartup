import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { IProductPageView } from "../products/pages";
import { WorkspacePage } from "./WorkspacePage";
import {
  documentConfirmation,
  parseDocument,
} from "../../../../../tools/studio/workspace/document";
import { ConfirmationBadge } from "./DocumentStatus";
import { DocumentDownloads } from "./DocumentDownloads";

function flatten(pages: IProductPageView[]): IProductPageView[] {
  return pages.flatMap((page) => [page, ...flatten(page.children)]);
}

interface IProductPagesProps {
  pages: IProductPageView[];
  overview?: boolean;
  children: ReactNode;
  downloadContext?: string;
  resolveLink?: (url: string) => string | { href: string; target: "_top" };
}

type Representation = "text" | "preview";

/** A page tree selects the document; Text/Layout selects its representation. */
export function ProductPages({
  pages,
  overview = false,
  children,
  downloadContext,
  resolveLink,
}: IProductPagesProps) {
  const all = flatten(pages);
  const first = all.find((page) => page.kind !== "group");
  const [selected, setSelected] = useState(overview ? "overview" : first?.id);
  const [representation, setRepresentation] = useState<Representation>("text");
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        all.filter((page) => page.children.length).map((page) => page.id),
      ),
  );
  const [focused, setFocused] = useState(all[0]?.id);
  const pendingAnchor = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pendingAnchor.current === null) return;
    const target = pendingAnchor.current;
    pendingAnchor.current = null;
    const anchor = [
      ...(contentRef.current?.querySelectorAll<HTMLElement>("[id]") ?? []),
    ].find((node) => node.id === target);
    (anchor ?? contentRef.current)?.scrollIntoView({ block: "start" });
  }, [selected]);
  if (!pages.length) return <>{children}</>;
  const page =
    selected === "overview" && overview
      ? undefined
      : (all.find((entry) => entry.id === selected && entry.kind !== "group") ??
        first);
  const mode =
    representation === "preview" && page?.representations?.preview
      ? "preview"
      : "text";
  const displayed = page?.representations ? page.representations[mode]! : page;
  const textPage = page?.representations?.text ?? page;
  const confirmation =
    page?.confirmation ??
    textPage?.confirmation ??
    (textPage?.kind === "markdown"
      ? documentConfirmation(textPage.markdown ?? "", textPage.layer)
      : undefined);
  const toggle = (id: string) => {
    if (expanded.has(id)) {
      const node = all.find((item) => item.id === id);
      if (node && flatten(node.children).some((child) => child.id === focused))
        setFocused(id);
    }
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const activate = (node: IProductPageView) => {
    setFocused(node.id);
    if (node.kind === "group") toggle(node.id);
    else setSelected(node.id);
  };
  const keyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    node: IProductPageView,
    parent?: string,
  ) => {
    const tree = event.currentTarget.closest('[role="tree"]');
    const items = Array.from(
      tree?.querySelectorAll<HTMLButtonElement>('[role="treeitem"]') ?? [],
    );
    const index = items.indexOf(event.currentTarget);
    let target: HTMLButtonElement | undefined;
    switch (event.key) {
      case "ArrowDown":
        target = items[index + 1] ?? items[index];
        break;
      case "ArrowUp":
        target = items[index - 1] ?? items[index];
        break;
      case "Home":
        target = items[0];
        break;
      case "End":
        target = items.at(-1);
        break;
      case "ArrowRight":
        if (node.children.length && !expanded.has(node.id)) toggle(node.id);
        else if (node.children.length) target = items[index + 1];
        break;
      case "ArrowLeft":
        if (node.children.length && expanded.has(node.id)) toggle(node.id);
        else target = items.find((item) => item.dataset.pageId === parent);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target) {
      setFocused(target.dataset.pageId ?? node.id);
      target.focus();
    }
  };
  const tree = (
    nodes: IProductPageView[],
    level = 1,
    parent?: string,
  ): ReactNode => (
    <ul
      role={level === 1 ? "tree" : "group"}
      aria-label={level === 1 ? "Page tree" : undefined}
      className="space-y-1"
    >
      {nodes.map((node) => (
        <li key={node.id} role="none">
          <div className="flex items-center">
            {node.children.length ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`${expanded.has(node.id) ? "Collapse" : "Expand"} ${node.title}`}
                onClick={() => toggle(node.id)}
                className="shrink-0 rounded px-2 py-2 text-slate-500 hover:bg-slate-100"
              >
                <span aria-hidden="true">
                  {expanded.has(node.id) ? "▾" : "▸"}
                </span>
              </button>
            ) : (
              <span
                aria-hidden="true"
                className="w-7 shrink-0 text-center text-slate-400"
              >
                ·
              </span>
            )}
            <button
              type="button"
              role="treeitem"
              aria-level={level}
              aria-expanded={
                node.children.length ? expanded.has(node.id) : undefined
              }
              aria-selected={selected === node.id}
              tabIndex={focused === node.id ? 0 : -1}
              data-page-id={node.id}
              onFocus={() => setFocused(node.id)}
              onKeyDown={(event) => keyDown(event, node, parent)}
              onClick={() => activate(node)}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-teal-600 ${selected === node.id ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <span className="block break-words">{node.title}</span>
              {node.route ? (
                <span className="block truncate text-xs font-normal text-slate-500">
                  {node.route}
                </span>
              ) : null}
            </button>
          </div>
          {node.children.length && expanded.has(node.id) ? (
            <div className="ml-3 border-l border-slate-200 pl-1">
              {tree(node.children, level + 1, node.id)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]"
      onClickCapture={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          "a[href]",
        );
        if (!link || link.hasAttribute("download")) return;
        const target = new URL(link.href, window.location.href);
        if (target.origin !== window.location.origin) return;
        const linked = all.find((entry) => {
          const url = entry.representations?.text.url ?? entry.url;
          return (
            url &&
            new URL(url, window.location.href).pathname === target.pathname
          );
        });
        if (!linked) return;
        event.preventDefault();
        const anchorId = decodeURIComponent(target.hash.slice(1));
        if (linked.id === selected) {
          const anchor = [
            ...(contentRef.current?.querySelectorAll<HTMLElement>("[id]") ??
              []),
          ].find((node) => node.id === anchorId);
          (anchor ?? contentRef.current)?.scrollIntoView({ block: "start" });
          return;
        }
        pendingAnchor.current = anchorId;
        setSelected(linked.id);
        setFocused(linked.id);
        setRepresentation("text");
        setExpanded(
          new Set(
            all
              .filter((entry) => entry.children.length)
              .map((entry) => entry.id),
          ),
        );
      }}
    >
      <nav
        aria-label="Section pages"
        className="border-b border-slate-200 p-3 md:border-b-0 md:border-r"
      >
        {overview ? (
          <button
            type="button"
            aria-current={selected === "overview" ? "page" : undefined}
            onClick={() => setSelected("overview")}
            className={`mb-4 w-full rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-teal-600 ${selected === "overview" ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Overview
          </button>
        ) : null}
        {tree(pages)}
      </nav>
      <div className="min-w-0" ref={contentRef}>
        {page && displayed ? (
          <div key={page.id}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-950">
                  {page.title}
                </h2>
                {confirmation ? (
                  <ConfirmationBadge confirmation={confirmation} />
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DocumentDownloads
                  fileName={[
                    downloadContext,
                    textPage?.downloadName ?? page.title,
                  ]
                    .filter(Boolean)
                    .join("-")}
                  htmlTargetRef={
                    displayed.kind === "html" ? undefined : exportRef
                  }
                  htmlUrl={
                    displayed.kind === "html" ? displayed.url : undefined
                  }
                  markdown={textPage?.markdown}
                  title={[downloadContext, page.title]
                    .filter(Boolean)
                    .join(" — ")}
                />
                {page.representations ? (
                  <div
                    role="group"
                    aria-label="Page representation"
                    className="inline-flex rounded-lg bg-slate-100 p-1"
                  >
                    {(["text", "preview"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={mode === value}
                        disabled={
                          value === "preview" && !page.representations?.preview
                        }
                        onClick={() => setRepresentation(value)}
                        className={`rounded-md px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:text-slate-400 ${mode === value ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"}`}
                      >
                        {value === "text" ? "Text" : "Layout"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {page.representations && !page.representations.preview ? (
              <p className="px-6 pt-4 text-sm text-slate-500">
                The page text is ready to work on. Its layout can be added next.
              </p>
            ) : null}
            <div ref={exportRef}>
              <WorkspacePage
                page={displayed}
                resolveLink={resolveLink}
                hideConfirmation
                hideTitle={
                  displayed.kind === "markdown" &&
                  parseDocument(displayed.markdown ?? "").body.match(
                    /^# (.+)$/m,
                  )?.[1] === page.title
                }
              />
              <p className="break-all border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
                Source: {displayed.sourcePath}
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
