import { useState, type ReactNode } from "react";
import type { IProductPageView } from "../products/pages";
import { WorkspacePage } from "./WorkspacePage";

function flatten(pages: IProductPageView[]): IProductPageView[] {
  return pages.flatMap((page) => [page, ...flatten(page.children)]);
}

interface IProductPagesProps {
  pages: IProductPageView[];
  overview?: boolean;
  children: ReactNode;
}

/** Optional nested navigation around a core document or a product-owned section. */
export function ProductPages({
  pages,
  overview = false,
  children,
}: IProductPagesProps) {
  const all = flatten(pages);
  const first = all.find((page) => page.kind !== "group");
  const [selected, setSelected] = useState(overview ? "overview" : first?.id);
  if (!pages.length) return <>{children}</>;
  const page =
    selected === "overview" && overview
      ? undefined
      : (all.find((entry) => entry.id === selected && entry.kind !== "group") ??
        first);
  const button = (id: string, title: string) => (
    <button
      type="button"
      aria-current={selected === id ? "page" : undefined}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${selected === id ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-slate-100"}`}
      onClick={() => setSelected(id)}
    >
      {title}
    </button>
  );
  const tree = (nodes: IProductPageView[]): ReactNode => (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          {node.kind === "group" ? (
            <span className="block px-3 py-2 text-sm font-semibold text-slate-900">
              {node.title}
            </span>
          ) : (
            button(node.id, node.title)
          )}
          {node.children.length ? (
            <div className="ml-3 border-l border-slate-200 pl-2">
              {tree(node.children)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]">
      <nav
        aria-label="Section pages"
        className="border-b border-slate-200 p-4 md:border-b-0 md:border-r"
      >
        {overview ? button("overview", "Overview") : null}
        {tree(pages)}
      </nav>
      <div className="min-w-0">
        {page ? (
          <div key={page.id}>
            <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-950">
              {page.title}
            </h2>
            <WorkspacePage page={page} />
            <p className="break-all border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
              Source: {page.sourcePath}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
