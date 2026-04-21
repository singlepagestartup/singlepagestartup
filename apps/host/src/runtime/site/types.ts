import { ReactNode } from "react";

import type { IModel as HostLayoutModel } from "@sps/host/models/layout/sdk/model";
import type { IModel as HostPageModel } from "@sps/host/models/page/sdk/model";
import type { IModel as HostWidgetModel } from "@sps/host/models/widget/sdk/model";
import type { IModel as HostLayoutsToWidgetsModel } from "@sps/host/relations/layouts-to-widgets/sdk/model";
import type { IModel as HostPagesToLayoutsModel } from "@sps/host/relations/pages-to-layouts/sdk/model";
import type { IModel as HostPagesToWidgetsModel } from "@sps/host/relations/pages-to-widgets/sdk/model";
import type { IModel as HostWidgetsToExternalWidgetsModel } from "@sps/host/relations/widgets-to-external-widgets/sdk/model";

export interface RouteRenderContext {
  url: string;
  language: string;
  isAdminRoute: boolean;
}

export interface ResolvedExternalWidgetNode {
  relation: HostWidgetsToExternalWidgetsModel;
}

export type ResolvedHostWidgetRelation =
  | HostPagesToWidgetsModel
  | HostLayoutsToWidgetsModel;

export interface ResolvedHostWidgetNode {
  slot: "page" | "layout-default" | "layout-additional";
  relation: ResolvedHostWidgetRelation;
  widget: HostWidgetModel;
  externalWidgets: ResolvedExternalWidgetNode[];
}

export interface ResolvedLayoutNode {
  relation: HostPagesToLayoutsModel;
  layout: HostLayoutModel;
  defaultWidgets: ResolvedHostWidgetNode[];
  additionalWidgets: ResolvedHostWidgetNode[];
}

export interface ResolvedPageGraph {
  page: HostPageModel;
  layouts: ResolvedLayoutNode[];
  pageWidgets: ResolvedHostWidgetNode[];
}

export interface HostPageRendererInput {
  context: RouteRenderContext;
  graph: ResolvedPageGraph;
}

export interface HostLayoutRendererInput {
  context: RouteRenderContext;
  node: ResolvedLayoutNode;
  children?: ReactNode;
}

export interface HostWidgetRendererInput {
  context: RouteRenderContext;
  node: ResolvedHostWidgetNode;
}

export interface ExternalWidgetRendererInput {
  context: RouteRenderContext;
  node: ResolvedExternalWidgetNode;
}

export type HostPageRenderer = (
  input: HostPageRendererInput,
) => Promise<ReactNode>;

export type HostLayoutRenderer = (
  input: HostLayoutRendererInput,
) => Promise<ReactNode>;

export type HostWidgetRenderer = (
  input: HostWidgetRendererInput,
) => Promise<ReactNode>;

export type ExternalWidgetRenderer = (
  input: ExternalWidgetRendererInput,
) => Promise<ReactNode>;

export interface ExternalWidgetAdapterEntity {
  id: string;
  variant?: string | null;
}

export interface ExternalWidgetAdapterLoadInput {
  context: RouteRenderContext;
  externalWidgetId: string;
  relation: HostWidgetsToExternalWidgetsModel;
}

export interface ExternalWidgetAdapterRenderInput<
  TEntity extends ExternalWidgetAdapterEntity = ExternalWidgetAdapterEntity,
> {
  context: RouteRenderContext;
  entity: TEntity;
  relation: HostWidgetsToExternalWidgetsModel;
}

export interface ExternalWidgetAdapter<
  TEntity extends ExternalWidgetAdapterEntity = ExternalWidgetAdapterEntity,
> {
  module: string;
  loadEntityServer(
    input: ExternalWidgetAdapterLoadInput,
  ): Promise<TEntity | undefined>;
  renderServer(
    input: ExternalWidgetAdapterRenderInput<TEntity>,
  ): Promise<ReactNode>;
  renderClient?(input: ExternalWidgetAdapterRenderInput<TEntity>): ReactNode;
  supportsVariant(variant: string | null | undefined): boolean;
}
