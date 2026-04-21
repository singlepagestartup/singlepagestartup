import { Fragment, ReactNode } from "react";

import { externalWidgetRegistry } from "../registries/external-widget";
import { hostWidgetRegistry } from "../registries/host-widget";
import {
  ExternalWidgetRendererInput,
  ResolvedExternalWidgetNode,
  ResolvedHostWidgetNode,
  RouteRenderContext,
} from "../types";
import { warnSiteRuntime } from "../warnings";

export async function renderExternalWidgetNodes(
  nodes: ResolvedExternalWidgetNode[],
  context: RouteRenderContext,
) {
  const renderedNodes = await Promise.all(
    nodes.map(async (node, index) => {
      const key = node.relation.id || `${node.relation.widgetId}-${index}`;

      return (
        <Fragment key={key}>
          {await renderExternalWidgetNode({
            context,
            node,
          })}
        </Fragment>
      );
    }),
  );

  return renderedNodes.filter(Boolean) as ReactNode[];
}

async function renderExternalWidgetNode(input: ExternalWidgetRendererInput) {
  const { node, context } = input;
  const externalModule = node.relation.externalModule;
  const adapter = externalWidgetRegistry[externalModule];

  if (!adapter) {
    warnSiteRuntime(
      `Unsupported external module "${externalModule}" for relation "${node.relation.id}".`,
    );
    return null;
  }

  const entity = await adapter.loadEntityServer({
    context,
    relation: node.relation,
    externalWidgetId: node.relation.externalWidgetId,
  });

  if (!entity?.id) {
    warnSiteRuntime(
      `External widget "${node.relation.externalWidgetId}" for module "${externalModule}" was not found.`,
    );
    return null;
  }

  if (!adapter.supportsVariant(entity.variant)) {
    warnSiteRuntime(
      `Unsupported external widget variant "${entity.variant}" for module "${externalModule}".`,
    );
    return null;
  }

  return adapter.renderServer({
    context,
    entity,
    relation: node.relation,
  });
}

export async function renderHostWidgetNodes(
  nodes: ResolvedHostWidgetNode[],
  context: RouteRenderContext,
) {
  const renderedNodes = await Promise.all(
    nodes.map(async (node, index) => {
      const renderer = hostWidgetRegistry[node.widget.variant];

      if (!renderer) {
        warnSiteRuntime(
          `Unsupported host widget variant "${node.widget.variant}" for widget "${node.widget.id}".`,
        );
        return null;
      }

      const key = node.relation.id || `${node.widget.id}-${index}`;

      return <Fragment key={key}>{await renderer({ context, node })}</Fragment>;
    }),
  );

  return renderedNodes.filter(Boolean) as ReactNode[];
}
