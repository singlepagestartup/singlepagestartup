import { api as hostLayoutApi } from "@sps/host/models/layout/sdk/server";
import { api as hostPageApi } from "@sps/host/models/page/sdk/server";
import { api as hostWidgetApi } from "@sps/host/models/widget/sdk/server";
import { api as layoutsToWidgetsApi } from "@sps/host/relations/layouts-to-widgets/sdk/server";
import { api as pagesToLayoutsApi } from "@sps/host/relations/pages-to-layouts/sdk/server";
import { api as pagesToWidgetsApi } from "@sps/host/relations/pages-to-widgets/sdk/server";
import { api as widgetsToExternalWidgetsApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";

import type { IModel as HostPageModel } from "@sps/host/models/page/sdk/model";
import type { IModel as HostWidgetModel } from "@sps/host/models/widget/sdk/model";
import type { IModel as HostLayoutsToWidgetsModel } from "@sps/host/relations/layouts-to-widgets/sdk/model";
import type { IModel as HostPagesToLayoutsModel } from "@sps/host/relations/pages-to-layouts/sdk/model";
import type { IModel as HostPagesToWidgetsModel } from "@sps/host/relations/pages-to-widgets/sdk/model";
import type { IModel as HostWidgetsToExternalWidgetsModel } from "@sps/host/relations/widgets-to-external-widgets/sdk/model";

import {
  ResolvedExternalWidgetNode,
  ResolvedHostWidgetNode,
  ResolvedLayoutNode,
  ResolvedPageGraph,
} from "./types";

function byOrderIndex(
  left: { orderIndex?: number },
  right: { orderIndex?: number },
) {
  return (left.orderIndex || 0) - (right.orderIndex || 0);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function findByIds<T extends { id: string }>(
  api: {
    findById: (props: { id: string }) => Promise<T | undefined>;
  },
  ids: string[],
): Promise<T[]> {
  const entities = await Promise.all(
    unique(ids).map((id) =>
      api
        .findById({
          id,
        })
        .catch(() => undefined),
    ),
  );

  return entities.filter((entity) => Boolean(entity?.id)) as T[];
}

function filterPageLayoutRelations(relations?: HostPagesToLayoutsModel[]) {
  return (relations || []).filter((relation) => relation.variant === "default");
}

function filterPageWidgetRelations(relations?: HostPagesToWidgetsModel[]) {
  return (relations || []).filter((relation) => relation.variant === "default");
}

function filterLayoutWidgetRelations(relations?: HostLayoutsToWidgetsModel[]) {
  return (relations || []).filter(
    (relation) =>
      relation.variant === "default" || relation.variant === "additional",
  );
}

function filterExternalWidgetRelations(
  relations?: HostWidgetsToExternalWidgetsModel[],
) {
  return (relations || []).filter((relation) => relation.variant === "default");
}

function buildExternalWidgetNodes(
  relations?: HostWidgetsToExternalWidgetsModel[],
): ResolvedExternalWidgetNode[] {
  return filterExternalWidgetRelations(relations)
    .sort(byOrderIndex)
    .map((relation) => ({
      relation,
    }));
}

function buildHostWidgetNode(params: {
  externalWidgetRelationsByWidgetId: Map<
    string,
    HostWidgetsToExternalWidgetsModel[]
  >;
  relation: HostPagesToWidgetsModel | HostLayoutsToWidgetsModel;
  slot: ResolvedHostWidgetNode["slot"];
  widgetsById: Map<string, HostWidgetModel>;
}) {
  const widget = params.widgetsById.get(params.relation.widgetId);

  if (!widget) {
    return;
  }

  return {
    slot: params.slot,
    relation: params.relation,
    widget,
    externalWidgets: buildExternalWidgetNodes(
      params.externalWidgetRelationsByWidgetId.get(widget.id),
    ),
  } satisfies ResolvedHostWidgetNode;
}

export function normalizeGraph(graph: ResolvedPageGraph): ResolvedPageGraph {
  return {
    ...graph,
    layouts: [...graph.layouts]
      .sort((left, right) => byOrderIndex(left.relation, right.relation))
      .map((layout) => ({
        ...layout,
        defaultWidgets: [...layout.defaultWidgets].sort((left, right) =>
          byOrderIndex(left.relation, right.relation),
        ),
        additionalWidgets: [...layout.additionalWidgets].sort((left, right) =>
          byOrderIndex(left.relation, right.relation),
        ),
      })),
    pageWidgets: [...graph.pageWidgets].sort((left, right) =>
      byOrderIndex(left.relation, right.relation),
    ),
  };
}

export async function loadPageByUrl(url: string) {
  return hostPageApi
    .findByUrl({
      url,
      catchErrors: true,
    })
    .catch(() => undefined);
}

export async function loadPageGraph(
  page: HostPageModel,
): Promise<ResolvedPageGraph> {
  const [pageLayoutRelationsResult, pageWidgetRelationsResult] =
    await Promise.all([
      pagesToLayoutsApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "pageId",
                  method: "eq",
                  value: page.id,
                },
              ],
            },
          },
          catchErrors: true,
        })
        .catch(() => undefined),
      pagesToWidgetsApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "pageId",
                  method: "eq",
                  value: page.id,
                },
              ],
            },
          },
          catchErrors: true,
        })
        .catch(() => undefined),
    ]);

  const pageLayoutRelations = filterPageLayoutRelations(
    pageLayoutRelationsResult,
  );
  const pageWidgetRelations = filterPageWidgetRelations(
    pageWidgetRelationsResult,
  );

  const layouts = await findByIds(
    hostLayoutApi,
    pageLayoutRelations.map((item) => item.layoutId),
  );
  const layoutsById = new Map(layouts.map((layout) => [layout.id, layout]));

  const layoutWidgetRelationEntries = await Promise.all(
    layouts.map(async (layout) => {
      const relations =
        (await layoutsToWidgetsApi
          .find({
            params: {
              filters: {
                and: [
                  {
                    column: "layoutId",
                    method: "eq",
                    value: layout.id,
                  },
                ],
              },
            },
            catchErrors: true,
          })
          .catch(() => undefined)) || [];

      return [layout.id, filterLayoutWidgetRelations(relations)] as const;
    }),
  );

  const layoutWidgetRelationsByLayoutId = new Map(layoutWidgetRelationEntries);
  const layoutWidgetRelations = layoutWidgetRelationEntries.flatMap(
    ([, relations]) => relations,
  );

  const widgets = await findByIds(hostWidgetApi, [
    ...pageWidgetRelations.map((item) => item.widgetId),
    ...layoutWidgetRelations.map((item) => item.widgetId),
  ]);

  const widgetsById = new Map(widgets.map((widget) => [widget.id, widget]));

  const externalWidgetRelationEntries = await Promise.all(
    widgets.map(async (widget) => {
      const relations =
        (await widgetsToExternalWidgetsApi
          .find({
            params: {
              filters: {
                and: [
                  {
                    column: "widgetId",
                    method: "eq",
                    value: widget.id,
                  },
                ],
              },
            },
            catchErrors: true,
          })
          .catch(() => undefined)) || [];

      return [widget.id, filterExternalWidgetRelations(relations)] as const;
    }),
  );

  const externalWidgetRelationsByWidgetId = new Map(
    externalWidgetRelationEntries,
  );

  const pageWidgets = pageWidgetRelations
    .sort(byOrderIndex)
    .map((relation) =>
      buildHostWidgetNode({
        relation,
        slot: "page",
        widgetsById,
        externalWidgetRelationsByWidgetId,
      }),
    )
    .filter((node): node is ResolvedHostWidgetNode => Boolean(node));

  const layoutsGraph = pageLayoutRelations
    .sort(byOrderIndex)
    .map((relation) => {
      const layout = layoutsById.get(relation.layoutId);

      if (!layout) {
        return;
      }

      const layoutWidgetRelations =
        layoutWidgetRelationsByLayoutId.get(layout.id) || [];

      const defaultWidgets = layoutWidgetRelations
        .filter((item) => item.variant === "default")
        .sort(byOrderIndex)
        .map((item) =>
          buildHostWidgetNode({
            relation: item,
            slot: "layout-default",
            widgetsById,
            externalWidgetRelationsByWidgetId,
          }),
        )
        .filter((node): node is ResolvedHostWidgetNode => Boolean(node));

      const additionalWidgets = layoutWidgetRelations
        .filter((item) => item.variant === "additional")
        .sort(byOrderIndex)
        .map((item) =>
          buildHostWidgetNode({
            relation: item,
            slot: "layout-additional",
            widgetsById,
            externalWidgetRelationsByWidgetId,
          }),
        )
        .filter((node): node is ResolvedHostWidgetNode => Boolean(node));

      return {
        relation,
        layout,
        defaultWidgets,
        additionalWidgets,
      } satisfies ResolvedLayoutNode;
    })
    .filter((node): node is ResolvedLayoutNode => Boolean(node));

  return normalizeGraph({
    page,
    layouts: layoutsGraph,
    pageWidgets,
  });
}
