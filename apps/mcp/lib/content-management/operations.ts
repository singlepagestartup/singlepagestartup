import {
  ContentCreateInputSchema,
  ContentDeleteApplyInputSchema,
  ContentDeletePreviewInputSchema,
  ContentFindInputSchema,
  ContentGetByIdInputSchema,
  ContentUpdateInputSchema,
  IContentCreateInput,
  IContentDeleteApplyInput,
  IContentFindInput,
  IContentGetByIdInput,
  IContentUpdateInput,
  ILocalizedFieldUpdateInput,
  LocalizedFieldUpdateInputSchema,
} from "./schemas";
import { getRbacSdkOptions } from "./auth";
import { buildLocalizedFieldPatch } from "./localized-field";
import {
  contentEntityRegistry,
  requireContentEntityDescriptor,
  summarizeContentEntity,
} from "./registry";
import {
  IContentEntityDescriptor,
  IContentQueryParams,
  IDeletePreview,
} from "./types";

export interface IContentOperationOptions {
  registry?: IContentEntityDescriptor[];
}

export function createDeleteConfirmationToken(props: {
  entity: string;
  id: string;
}) {
  return `${props.entity}:${props.id}`;
}

function buildFindParams(input: IContentFindInput): IContentQueryParams {
  return {
    ...(input.filters ? { filters: input.filters } : {}),
    ...(input.orderBy ? { orderBy: input.orderBy } : {}),
    ...(input.limit ? { limit: input.limit } : {}),
    ...(input.offset !== undefined ? { offset: input.offset } : {}),
  };
}

function buildCountParams(input: { filters?: IContentFindInput["filters"] }) {
  return {
    ...(input.filters ? { filters: input.filters } : {}),
  };
}

function requireOperation(
  descriptor: IContentEntityDescriptor,
  operation: string,
) {
  if (!descriptor.operations.includes(operation as any)) {
    throw new Error(
      `Validation error. ${descriptor.key} does not support ${operation}`,
    );
  }
}

function parseCreateData(
  descriptor: IContentEntityDescriptor,
  data: Record<string, unknown>,
) {
  const parsed = descriptor.insertSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data as Record<string, unknown>;
}

function parseUpdateData(
  descriptor: IContentEntityDescriptor,
  data: Record<string, unknown>,
) {
  const parsed = descriptor.insertSchema.partial().safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data as Record<string, unknown>;
}

export function describeContentEntities(options?: IContentOperationOptions) {
  const registry = options?.registry ?? contentEntityRegistry;

  return registry.map((descriptor) => summarizeContentEntity(descriptor));
}

export function describeContentEntity(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentGetByIdInputSchema.pick({ entity: true }).safeParse(
    input,
  );

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );

  return summarizeContentEntity(descriptor);
}

export async function findContentRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentFindInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "find");

  return await descriptor.api.find({
    params: buildFindParams(parsed.data),
    options: getRbacSdkOptions(),
  });
}

export async function countContentRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentFindInputSchema.pick({
    entity: true,
    filters: true,
  }).safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "count");

  return await descriptor.api.count({
    params: buildCountParams(parsed.data),
    options: getRbacSdkOptions(),
  });
}

export async function getContentRecordById(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentGetByIdInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "get-by-id");

  const record = await descriptor.api.findById({
    id: parsed.data.id,
    options: getRbacSdkOptions(),
  });

  if (!record) {
    throw new Error(
      `Not Found error. ${parsed.data.entity} record ${parsed.data.id} not found`,
    );
  }

  return record;
}

async function findContextRecords(
  input: IContentFindInput,
  options?: IContentOperationOptions,
) {
  try {
    return ((await findContentRecords(input, options)) ?? []) as Record<
      string,
      any
    >[];
  } catch {
    return [];
  }
}

async function getContextRecord(
  input: IContentGetByIdInput,
  options?: IContentOperationOptions,
) {
  try {
    return (await getContentRecordById(input, options)) as Record<string, any>;
  } catch {
    return;
  }
}

async function buildDeleteRelationContext(
  input: IContentGetByIdInput,
  record: Record<string, any>,
  options?: IContentOperationOptions,
) {
  if (input.entity === "host.page") {
    const pageWidgets = await findContextRecords(
      {
        entity: "host.pages-to-widgets",
        filters: {
          and: [{ column: "pageId", method: "eq", value: input.id }],
        },
        limit: 100,
      },
      options,
    );

    return pageWidgets.length ? { pageWidgets } : undefined;
  }

  if (input.entity === "host.widget") {
    const pageWidgets = await findContextRecords(
      {
        entity: "host.pages-to-widgets",
        filters: {
          and: [{ column: "widgetId", method: "eq", value: input.id }],
        },
        limit: 100,
      },
      options,
    );
    const externalWidgetRelations = await findContextRecords(
      {
        entity: "host.widgets-to-external-widgets",
        filters: {
          and: [{ column: "widgetId", method: "eq", value: input.id }],
        },
        limit: 100,
      },
      options,
    );

    if (!pageWidgets.length && !externalWidgetRelations.length) {
      return;
    }

    return {
      pageWidgets,
      externalWidgetRelations,
    };
  }

  if (input.entity === "host.pages-to-widgets") {
    const page =
      typeof record.pageId === "string"
        ? await getContextRecord(
            { entity: "host.page", id: record.pageId },
            options,
          )
        : undefined;
    const hostWidget =
      typeof record.widgetId === "string"
        ? await getContextRecord(
            { entity: "host.widget", id: record.widgetId },
            options,
          )
        : undefined;

    if (!page && !hostWidget) {
      return;
    }

    return {
      page,
      hostWidget,
    };
  }

  if (input.entity === "host.widgets-to-external-widgets") {
    const hostWidget =
      typeof record.widgetId === "string"
        ? await getContextRecord(
            { entity: "host.widget", id: record.widgetId },
            options,
          )
        : undefined;
    const externalWidget =
      record.externalModule === "blog" &&
      typeof record.externalWidgetId === "string"
        ? await getContextRecord(
            { entity: "blog.widget", id: record.externalWidgetId },
            options,
          )
        : undefined;

    if (!hostWidget && !externalWidget) {
      return;
    }

    return {
      hostWidget,
      externalWidget,
    };
  }

  if (input.entity === "blog.widget") {
    const externalWidgetRelations = await findContextRecords(
      {
        entity: "host.widgets-to-external-widgets",
        filters: {
          and: [
            { column: "externalModule", method: "eq", value: "blog" },
            { column: "externalWidgetId", method: "eq", value: input.id },
          ],
        },
        limit: 100,
      },
      options,
    );
    const widgetIds = Array.from(
      new Set(
        externalWidgetRelations
          .map((relation) => relation.widgetId)
          .filter(
            (widgetId): widgetId is string => typeof widgetId === "string",
          ),
      ),
    );
    const hostWidgets = (
      await Promise.all(
        widgetIds.map((widgetId) =>
          getContextRecord({ entity: "host.widget", id: widgetId }, options),
        ),
      )
    ).filter((hostWidget): hostWidget is Record<string, any> =>
      Boolean(hostWidget),
    );
    const pageWidgets = (
      await Promise.all(
        widgetIds.map((widgetId) =>
          findContextRecords(
            {
              entity: "host.pages-to-widgets",
              filters: {
                and: [{ column: "widgetId", method: "eq", value: widgetId }],
              },
              limit: 100,
            },
            options,
          ),
        ),
      )
    ).flat();

    if (
      !externalWidgetRelations.length &&
      !hostWidgets.length &&
      !pageWidgets.length
    ) {
      return;
    }

    return {
      externalWidgetRelations,
      hostWidgets,
      pageWidgets,
    };
  }

  return undefined;
}

export async function createContentRecord(
  input: IContentCreateInput | unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentCreateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "create");

  const data = parseCreateData(descriptor, parsed.data.data);

  if (parsed.data.dryRun) {
    return {
      operation: "create",
      entity: descriptor.key,
      data,
    };
  }

  return await descriptor.api.create({
    data,
    options: getRbacSdkOptions(),
  });
}

export async function updateContentRecord(
  input: IContentUpdateInput | unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentUpdateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "update");

  const data = parseUpdateData(descriptor, parsed.data.data);

  if (parsed.data.dryRun) {
    return {
      operation: "update",
      entity: descriptor.key,
      id: parsed.data.id,
      data,
    };
  }

  return await descriptor.api.update({
    id: parsed.data.id,
    data,
    options: getRbacSdkOptions(),
  });
}

export async function previewDeleteContentRecord(
  input: unknown,
  options?: IContentOperationOptions,
): Promise<IDeletePreview> {
  const parsed = ContentDeletePreviewInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const record = await getContentRecordById(parsed.data, options);
  const relationContext = await buildDeleteRelationContext(
    parsed.data,
    record,
    options,
  );

  return {
    entity: parsed.data.entity,
    id: parsed.data.id,
    record,
    confirmationToken: createDeleteConfirmationToken(parsed.data),
    ...(relationContext ? { relationContext } : {}),
  };
}

export async function applyDeleteContentRecord(
  input: IContentDeleteApplyInput | unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentDeleteApplyInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const expectedToken = createDeleteConfirmationToken(parsed.data);

  if (parsed.data.confirmationToken !== expectedToken) {
    throw new Error(
      "Validation error. Delete confirmation token does not match entity and id",
    );
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "delete");

  return await descriptor.api.delete({
    id: parsed.data.id,
    options: getRbacSdkOptions(),
  });
}

export async function updateLocalizedContentField(
  input: ILocalizedFieldUpdateInput | unknown,
  options?: IContentOperationOptions,
) {
  const parsed = LocalizedFieldUpdateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "update");

  const current = await getContentRecordById(parsed.data, options);
  const data = buildLocalizedFieldPatch({
    descriptor,
    current,
    field: parsed.data.field,
    locale: parsed.data.locale,
    value: parsed.data.value,
  });

  if (parsed.data.dryRun) {
    return {
      operation: "localized-field-update",
      entity: descriptor.key,
      id: parsed.data.id,
      before: current[parsed.data.field],
      after: data[parsed.data.field],
      data,
    };
  }

  const updated = await descriptor.api.update({
    id: parsed.data.id,
    data,
    options: getRbacSdkOptions(),
  });

  return {
    operation: "localized-field-update",
    entity: descriptor.key,
    id: parsed.data.id,
    before: current[parsed.data.field],
    after: updated?.[parsed.data.field],
    data: updated,
  };
}
