import { hostPageRegistry } from "../registries/page";
import { RouteRenderContext } from "../types";
import { warnSiteRuntime } from "../warnings";
import { loadPageByUrl, loadPageGraph } from "../graph";

export async function renderSitePageByUrl(context: RouteRenderContext) {
  const page = await loadPageByUrl(context.url);

  if (!page?.id) {
    return null;
  }

  const renderer = hostPageRegistry[page.variant];

  if (!renderer) {
    warnSiteRuntime(
      `Unsupported host page variant "${page.variant}" for page "${page.id}".`,
    );
    return null;
  }

  const graph = await loadPageGraph(page);

  return renderer({
    context,
    graph,
  });
}
