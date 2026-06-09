import { loadPageByUrl, loadPageGraph } from "./graph";
import { HtmlFragment } from "./html-fragment";
import {
  isSupportedFragmentModule,
  renderRemoteComponentFragment,
} from "./remote";
import {
  ResolvedExternalWidgetNode,
  ResolvedHostWidgetNode,
  RouteRenderContext,
} from "./types";

function warnFragmentRuntime(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[site-fragments] ${message}`);
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderUnsupportedExternalWidget(node: ResolvedExternalWidgetNode) {
  if (process.env.NODE_ENV === "production") {
    return "";
  }

  const moduleName = escapeHtml(node.relation.externalModule);
  const relationId = escapeHtml(node.relation.id);
  const externalWidgetId = escapeHtml(node.relation.externalWidgetId);

  return `
    <section
      data-sps-fragment-placeholder
      data-module="${moduleName}"
      data-relation-id="${relationId}"
      data-external-widget-id="${externalWidgetId}"
      class="w-full rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p class="font-medium">Unsupported fragment module: ${moduleName}</p>
      <p class="text-xs opacity-80">relation: ${relationId}</p>
      <p class="text-xs opacity-80">externalWidgetId: ${externalWidgetId}</p>
    </section>
  `;
}

function renderEmptyPagePlaceholder(pageId: string | undefined) {
  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return `
    <section
      data-sps-fragment-empty-page
      data-page-id="${escapeHtml(pageId)}"
      class="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <p class="font-medium">The fragment route runtime rendered no supported widgets for this page.</p>
      <p class="text-xs opacity-80">Add a module app fragment route for this page's external modules.</p>
    </section>
  `;
}

async function renderExternalWidget(
  node: ResolvedExternalWidgetNode,
  context: RouteRenderContext,
) {
  if (!isSupportedFragmentModule(node.relation.externalModule)) {
    warnFragmentRuntime(
      `Unsupported fragment external module "${node.relation.externalModule}" for relation "${node.relation.id}".`,
    );

    return renderUnsupportedExternalWidget(node);
  }

  return await renderRemoteComponentFragment({
    module: node.relation.externalModule,
    target: {
      kind: "model",
      name: "widget",
      variant: "default",
    },
    searchParams: {
      contextUrl: context.url,
      externalWidgetId: node.relation.externalWidgetId,
      language: context.language,
      recipe: "ecommerce-product-actions",
      relationId: node.relation.id,
    },
  });
}

async function renderHostWidget(
  node: ResolvedHostWidgetNode,
  context: RouteRenderContext,
) {
  const fragments = await Promise.all(
    node.externalWidgets.map((externalWidget) =>
      renderExternalWidget(externalWidget, context),
    ),
  );

  return fragments.join("");
}

export async function renderFragmentSitePageByUrl(context: RouteRenderContext) {
  if (context.isAdminRoute) {
    return null;
  }

  const page = await loadPageByUrl(context.url);

  if (!page) {
    return null;
  }

  const graph = await loadPageGraph(page);
  const pageWidgets = await Promise.all(
    graph.pageWidgets.map((widget) => renderHostWidget(widget, context)),
  );

  const layouts = await Promise.all(
    graph.layouts.map(async (layoutNode) => {
      const defaultWidgets = await Promise.all(
        layoutNode.defaultWidgets.map((widget) =>
          renderHostWidget(widget, context),
        ),
      );
      const additionalWidgets = await Promise.all(
        layoutNode.additionalWidgets.map((widget) =>
          renderHostWidget(widget, context),
        ),
      );

      return [...defaultWidgets, ...pageWidgets, ...additionalWidgets].join("");
    }),
  );

  const html = layouts.length > 0 ? layouts.join("") : pageWidgets.join("");
  const renderedHtml = html || renderEmptyPagePlaceholder(page.id);

  return (
    <main
      data-module="host"
      data-model="page"
      data-id={page.id || ""}
      data-variant={page.variant}
      className="w-full flex flex-col"
    >
      <HtmlFragment html={renderedHtml} />
    </main>
  );
}
