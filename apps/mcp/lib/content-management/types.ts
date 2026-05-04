import { z } from "zod";

export type IContentEntityKey =
  | "host.page"
  | "host.widget"
  | "host.pages-to-widgets"
  | "host.widgets-to-external-widgets"
  | "blog.widget";

export type IContentEntityKind = "model" | "relation";

export type IContentOperation =
  | "find"
  | "count"
  | "get-by-id"
  | "create"
  | "update"
  | "delete";

export interface IContentFilter {
  column: string;
  method: string;
  value?: unknown;
}

export interface IContentOrderBy {
  column: string;
  method: "asc" | "desc";
}

export interface IContentQueryParams {
  filters?: {
    and?: IContentFilter[];
  };
  orderBy?: {
    and?: IContentOrderBy[];
  };
  limit?: number;
  offset?: number;
}

export interface IContentSdkOptions {
  headers?: Record<string, string>;
}

export interface IContentSdkAdapter<
  TEntity extends Record<string, any> = Record<string, any>,
> {
  find: (props?: {
    params?: IContentQueryParams;
    options?: IContentSdkOptions;
  }) => Promise<TEntity[] | undefined>;
  count: (props?: {
    params?: Pick<IContentQueryParams, "filters">;
    options?: IContentSdkOptions;
  }) => Promise<number | undefined>;
  findById: (props: {
    id: string;
    options?: IContentSdkOptions;
  }) => Promise<TEntity | undefined>;
  create: (props: {
    data: Record<string, unknown>;
    options?: IContentSdkOptions;
  }) => Promise<TEntity | undefined>;
  update: (props: {
    id: string;
    data: Record<string, unknown>;
    options?: IContentSdkOptions;
  }) => Promise<TEntity | undefined>;
  delete: (props: {
    id: string;
    options?: IContentSdkOptions;
  }) => Promise<TEntity | undefined>;
  findByUrl?: (props: {
    url: string;
    catchErrors?: boolean;
    silentErrorStatuses?: number[];
  }) => Promise<TEntity | undefined>;
}

export interface IContentFieldDescriptor {
  name: string;
  type: string;
  required?: boolean;
  localized?: boolean;
  relation?: {
    entity: IContentEntityKey;
    field: string;
  };
  description?: string;
}

export interface IContentEntityDescriptor<
  TEntity extends Record<string, any> = Record<string, any>,
> {
  key: IContentEntityKey;
  kind: IContentEntityKind;
  module: string;
  name: string;
  route: string;
  title: string;
  description: string;
  variants: readonly string[];
  fields: IContentFieldDescriptor[];
  localizedFields: string[];
  relationFields: IContentFieldDescriptor[];
  externalModules?: readonly string[];
  operations: readonly IContentOperation[];
  insertSchema: z.AnyZodObject;
  selectSchema: z.AnyZodObject;
  api: IContentSdkAdapter<TEntity>;
}

export interface IContentEntitySummary {
  key: IContentEntityKey;
  kind: IContentEntityKind;
  module: string;
  name: string;
  route: string;
  title: string;
  description: string;
  variants: readonly string[];
  fields: IContentFieldDescriptor[];
  localizedFields: string[];
  relationFields: IContentFieldDescriptor[];
  externalModules?: readonly string[];
  operations: readonly IContentOperation[];
}

export type IContentToolEnvelope =
  | {
      ok: true;
      type: string;
      data: unknown;
      meta?: Record<string, unknown>;
    }
  | {
      ok: false;
      error: {
        kind: string;
        message: string;
        details?: unknown;
      };
    };

export interface IDeletePreview {
  entity: IContentEntityKey;
  id: string;
  record: Record<string, any>;
  confirmationToken: string;
  relationContext?: Record<string, any>;
}

export interface IHostGraphCandidate {
  id: string;
  page: Record<string, any>;
  pageWidget: Record<string, any>;
  hostWidget?: Record<string, any>;
  externalWidgetRelation?: Record<string, any>;
  externalEntityKey?: IContentEntityKey;
  externalWidget?: Record<string, any>;
  summary: {
    pageUrl?: string;
    pageId?: string;
    pageWidgetId?: string;
    hostWidgetId?: string;
    externalRelationId?: string;
    externalModule?: string;
    externalWidgetId?: string;
    adminTitle?: string;
    title?: string;
    slug?: string;
    variant?: string;
  };
}

export interface IHostGraphResult {
  url: string;
  language: string;
  page?: Record<string, any>;
  candidates: IHostGraphCandidate[];
  matchStatus: "none" | "single" | "multiple";
}
