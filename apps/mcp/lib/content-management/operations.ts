import {
  ContentCreateInputSchema,
  ContentDeleteApplyInputSchema,
  ContentDeletePreviewInputSchema,
  ContentFindInputSchema,
  ContentGetByIdInputSchema,
  ContentModelCountInputSchema,
  ContentModelCreateInputSchema,
  ContentModelDeleteApplyInputSchema,
  ContentModelDeletePreviewInputSchema,
  ContentModelFindInputSchema,
  ContentModelGetByIdInputSchema,
  ContentModelSelectorSchema,
  ContentModelUpdateInputSchema,
  ContentRelationCountInputSchema,
  ContentRelationCreateInputSchema,
  ContentRelationDeleteApplyInputSchema,
  ContentRelationDeletePreviewInputSchema,
  ContentRelationFindInputSchema,
  ContentRelationGetByIdInputSchema,
  ContentRelationSelectorSchema,
  ContentRelationUpdateInputSchema,
  ContentUpdateInputSchema,
  IContentCreateInput,
  IContentDeleteApplyInput,
  IContentFindInput,
  IContentGetByIdInput,
  IContentUpdateInput,
  ILocalizedFieldUpdateInput,
  LocalizedFieldUpdateInputSchema,
} from "./schemas";
import { getMcpSdkOptions } from "./auth";
import { buildLocalizedFieldPatch } from "./localized-field";
import {
  requireContentModelDescriptor,
  requireContentRelationDescriptor,
  requireContentEntityDescriptor,
  summarizeContentModules,
  summarizeContentEntity,
} from "./registry";
import {
  createFileStorageFileRecord,
  isFileStorageFileDescriptor,
} from "./file-storage";
import {
  IContentEntityDescriptor,
  IContentQueryParams,
  IDeletePreview,
} from "./types";

export interface IContentOperationOptions {
  registry?: IContentEntityDescriptor[];
  authHeaders?: Record<string, string>;
}

export function createDeleteConfirmationToken(props: {
  descriptor: IContentEntityDescriptor;
  id: string;
}) {
  return `${props.descriptor.kind}:${props.descriptor.module}:${props.descriptor.name}:${props.id}`;
}

function modelSelectorToEntity(input: { module: string; model: string }) {
  return `${input.module}.${input.model}`;
}

function relationSelectorToEntity(input: { module: string; relation: string }) {
  return `${input.module}.${input.relation}`;
}

function publicSelector(descriptor: IContentEntityDescriptor) {
  return descriptor.kind === "model"
    ? { module: descriptor.module, model: descriptor.name }
    : { module: descriptor.module, relation: descriptor.name };
}

async function assertContentModelSelector(
  input: { module: string; model: string },
  options?: IContentOperationOptions,
) {
  await requireContentModelDescriptor(input, options?.registry);
}

async function assertContentRelationSelector(
  input: { module: string; relation: string },
  options?: IContentOperationOptions,
) {
  await requireContentRelationDescriptor(input, options?.registry);
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
  return {
    modules: summarizeContentModules(options?.registry),
  };
}

export async function describeContentEntity(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentGetByIdInputSchema.pick({ entity: true }).safeParse(
    input,
  );

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );

  return summarizeContentEntity(descriptor);
}

export async function describeContentModel(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelSelectorSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return summarizeContentEntity(
    await requireContentModelDescriptor(parsed.data, options?.registry),
  );
}

export async function describeContentRelation(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationSelectorSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return summarizeContentEntity(
    await requireContentRelationDescriptor(parsed.data, options?.registry),
  );
}

export async function findContentRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentFindInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "find");

  return await descriptor.api.find({
    params: buildFindParams(parsed.data),
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
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

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "count");

  return await descriptor.api.count({
    params: buildCountParams(parsed.data),
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
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

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "get");

  const record = await descriptor.api.findById({
    id: parsed.data.id,
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
  });

  if (!record) {
    throw new Error(
      `Not Found error. ${parsed.data.entity} record ${parsed.data.id} not found`,
    );
  }

  return record;
}

export async function findContentModelRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelFindInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await findContentRecords(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function countContentModelRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelCountInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await countContentRecords(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function getContentModelRecordById(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelGetByIdInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await getContentRecordById(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function createContentModelRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelCreateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await createContentRecord(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function updateContentModelRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelUpdateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await updateContentRecord(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function previewDeleteContentModelRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelDeletePreviewInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await previewDeleteContentRecord(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function applyDeleteContentModelRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentModelDeleteApplyInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentModelSelector(parsed.data, options);

  return await applyDeleteContentRecord(
    {
      ...parsed.data,
      entity: modelSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function findContentRelationRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationFindInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await findContentRecords(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function countContentRelationRecords(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationCountInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await countContentRecords(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function getContentRelationRecordById(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationGetByIdInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await getContentRecordById(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function createContentRelationRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationCreateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await createContentRecord(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function updateContentRelationRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationUpdateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await updateContentRecord(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function previewDeleteContentRelationRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationDeletePreviewInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await previewDeleteContentRecord(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
}

export async function applyDeleteContentRelationRecord(
  input: unknown,
  options?: IContentOperationOptions,
) {
  const parsed = ContentRelationDeleteApplyInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await assertContentRelationSelector(parsed.data, options);

  return await applyDeleteContentRecord(
    {
      ...parsed.data,
      entity: relationSelectorToEntity(parsed.data),
    },
    options,
  );
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

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "create");

  if (isFileStorageFileDescriptor(descriptor)) {
    const fileStorageRecord = await createFileStorageFileRecord({
      descriptor,
      input: parsed.data,
      options: getMcpSdkOptions(options?.authHeaders ?? {}),
    });

    if (fileStorageRecord) {
      return fileStorageRecord;
    }
  }

  const data = parseCreateData(descriptor, parsed.data.data);

  if (parsed.data.dryRun) {
    return {
      operation: "create",
      ...publicSelector(descriptor),
      data,
    };
  }

  return await descriptor.api.create({
    data,
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
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

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  requireOperation(descriptor, "update");

  const data = parseUpdateData(descriptor, parsed.data.data);

  if (parsed.data.dryRun) {
    return {
      operation: "update",
      ...publicSelector(descriptor),
      id: parsed.data.id,
      data,
    };
  }

  return await descriptor.api.update({
    id: parsed.data.id,
    data,
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
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
  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  const relationContext = await buildDeleteRelationContext(
    parsed.data,
    record,
    options,
  );

  return {
    ...publicSelector(descriptor),
    id: parsed.data.id,
    record,
    confirmationToken: createDeleteConfirmationToken({
      descriptor,
      id: parsed.data.id,
    }),
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

  const descriptor = await requireContentEntityDescriptor(
    parsed.data.entity,
    options?.registry,
  );
  const expectedToken = createDeleteConfirmationToken({
    descriptor,
    id: parsed.data.id,
  });

  if (parsed.data.confirmationToken !== expectedToken) {
    throw new Error(
      "Validation error. Delete confirmation token does not match selector and id",
    );
  }

  requireOperation(descriptor, "delete");

  return await descriptor.api.delete({
    id: parsed.data.id,
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
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

  const descriptor = await requireContentEntityDescriptor(
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
      ...publicSelector(descriptor),
      id: parsed.data.id,
      before: current[parsed.data.field],
      after: data[parsed.data.field],
      data,
    };
  }

  const updated = await descriptor.api.update({
    id: parsed.data.id,
    data,
    options: getMcpSdkOptions(options?.authHeaders ?? {}),
  });

  return {
    operation: "localized-field-update",
    ...publicSelector(descriptor),
    id: parsed.data.id,
    before: current[parsed.data.field],
    after: updated?.[parsed.data.field],
    data: updated,
  };
}
