import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  IContentEntityDescriptor,
  IContentEntityKey,
  IContentEntityKind,
  IContentEntitySummary,
  IContentFieldDescriptor,
  IContentModuleSummary,
  IContentOperation,
  IContentSdkAdapter,
} from "./types";

const defaultOperations = [
  "find",
  "count",
  "get",
  "create",
  "update",
  "delete",
] as const satisfies readonly IContentOperation[];

interface IContentEntityRef {
  key: IContentEntityKey;
  kind: IContentEntityKind;
  module: string;
  name: string;
  label: string;
  modelImportPath: string;
  serverImportPath: string;
  operations: readonly IContentOperation[];
}

interface ISdkModelModule {
  insertSchema?: z.AnyZodObject;
  selectSchema?: z.AnyZodObject;
  route?: string;
  variants?: readonly string[];
  externalModules?: readonly string[];
}

interface ISdkServerModule {
  api?: IContentSdkAdapter;
}

export const contentEntityRegistry: IContentEntityDescriptor[] = [];

let contentEntityRefs: IContentEntityRef[] | undefined;
const descriptorCache = new Map<
  IContentEntityKey,
  Promise<IContentEntityDescriptor>
>();

function getRepositoryRoot() {
  let currentDirectory = process.cwd();

  while (currentDirectory !== path.dirname(currentDirectory)) {
    if (existsSync(path.join(currentDirectory, "libs/modules"))) {
      return currentDirectory;
    }

    currentDirectory = path.dirname(currentDirectory);
  }

  return path.resolve(process.cwd(), "../..");
}

function toLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function listDirectories(directory: string) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function hasSdkEntry(entityDirectory: string) {
  return (
    existsSync(path.join(entityDirectory, "sdk/model/index.ts")) &&
    existsSync(path.join(entityDirectory, "sdk/server/index.ts"))
  );
}

function createEntityRef(props: {
  module: string;
  kind: IContentEntityKind;
  name: string;
}): IContentEntityRef {
  const directory = props.kind === "model" ? "models" : "relations";

  return {
    key: `${props.module}.${props.name}`,
    kind: props.kind,
    module: props.module,
    name: props.name,
    label: toLabel(props.name),
    modelImportPath: `@sps/${props.module}/${directory}/${props.name}/sdk/model`,
    serverImportPath: `@sps/${props.module}/${directory}/${props.name}/sdk/server`,
    operations: defaultOperations,
  };
}

function discoverContentEntityRefs() {
  const modulesDirectory = path.join(getRepositoryRoot(), "libs/modules");
  const refs: IContentEntityRef[] = [];

  for (const moduleName of listDirectories(modulesDirectory)) {
    const moduleDirectory = path.join(modulesDirectory, moduleName);

    for (const modelName of listDirectories(
      path.join(moduleDirectory, "models"),
    )) {
      const modelDirectory = path.join(moduleDirectory, "models", modelName);

      if (!hasSdkEntry(modelDirectory)) {
        continue;
      }

      refs.push(
        createEntityRef({
          module: moduleName,
          kind: "model",
          name: modelName,
        }),
      );
    }

    for (const relationName of listDirectories(
      path.join(moduleDirectory, "relations"),
    )) {
      const relationDirectory = path.join(
        moduleDirectory,
        "relations",
        relationName,
      );

      if (!hasSdkEntry(relationDirectory)) {
        continue;
      }

      refs.push(
        createEntityRef({
          module: moduleName,
          kind: "relation",
          name: relationName,
        }),
      );
    }
  }

  return refs.sort((a, b) => a.key.localeCompare(b.key));
}

export function listContentEntityRefs() {
  if (!contentEntityRefs) {
    contentEntityRefs = discoverContentEntityRefs();
  }

  return contentEntityRefs;
}

function getZodShape(schema: z.AnyZodObject | undefined) {
  if (!schema) {
    return {};
  }

  const zodObject = schema as any;
  const shape = zodObject.shape ?? zodObject._def?.shape;

  if (typeof shape === "function") {
    return shape() as Record<string, z.ZodTypeAny>;
  }

  return (shape ?? {}) as Record<string, z.ZodTypeAny>;
}

function unwrapSchema(
  schema: z.ZodTypeAny | undefined,
): z.ZodTypeAny | undefined {
  let current = schema;

  while (current) {
    const typeName = (current as any)._def?.typeName;

    if (
      typeName === z.ZodFirstPartyTypeKind.ZodOptional ||
      typeName === z.ZodFirstPartyTypeKind.ZodNullable ||
      typeName === z.ZodFirstPartyTypeKind.ZodDefault
    ) {
      current = (current as any)._def.innerType;
      continue;
    }

    if (typeName === z.ZodFirstPartyTypeKind.ZodEffects) {
      current = (current as any)._def.schema;
      continue;
    }

    return current;
  }

  return current;
}

function inferFieldType(schema: z.ZodTypeAny | undefined) {
  const unwrapped = unwrapSchema(schema);
  const typeName = (unwrapped as any)?._def?.typeName;

  switch (typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return "string";
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return "number";
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return "boolean";
    case z.ZodFirstPartyTypeKind.ZodDate:
      return "date";
    case z.ZodFirstPartyTypeKind.ZodArray:
      return "array";
    case z.ZodFirstPartyTypeKind.ZodRecord:
      return "record";
    case z.ZodFirstPartyTypeKind.ZodObject:
      return "object";
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return "enum";
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return "literal";
    default:
      return "unknown";
  }
}

function isRequired(schema: z.ZodTypeAny | undefined) {
  if (!schema) {
    return false;
  }

  return !schema.safeParse(undefined).success;
}

function isLocalizedField(name: string, schema: z.ZodTypeAny | undefined) {
  const type = inferFieldType(schema);

  return (
    ["title", "subtitle", "description"].includes(name) &&
    ["record", "object", "unknown"].includes(type)
  );
}

function buildFields(props: {
  insertSchema: z.AnyZodObject;
  selectSchema: z.AnyZodObject;
}) {
  const insertShape = getZodShape(props.insertSchema);
  const selectShape = getZodShape(props.selectSchema);
  const fieldNames = Array.from(
    new Set([...Object.keys(selectShape), ...Object.keys(insertShape)]),
  ).sort((a, b) => a.localeCompare(b));

  const fields = fieldNames.map((name): IContentFieldDescriptor => {
    const schema = selectShape[name] ?? insertShape[name];
    const writable = Boolean(insertShape[name]);

    return {
      name,
      type: inferFieldType(schema),
      writable,
      ...(writable ? { required: isRequired(insertShape[name]) } : {}),
      ...(isLocalizedField(name, schema) ? { localized: true } : {}),
    };
  });

  return {
    fields,
    localizedFields: fields
      .filter((field) => field.localized)
      .map((field) => field.name),
    relationFields: fields.filter(
      (field) => field.name.endsWith("Id") && field.name !== "id",
    ),
  };
}

function buildExampleValue(field: IContentFieldDescriptor) {
  if (field.localized) {
    return { en: `<${field.name}>` };
  }

  if (field.name.endsWith("Id")) {
    return `<${field.name}>`;
  }

  switch (field.type) {
    case "number":
      return 0;
    case "boolean":
      return true;
    case "array":
      return [];
    case "record":
    case "object":
      return {};
    default:
      return `<${field.name}>`;
  }
}

function buildWriteExamples(fields: IContentFieldDescriptor[]) {
  const writeData = fields
    .filter((field) => field.writable)
    .filter((field) => !["id", "createdAt", "updatedAt"].includes(field.name))
    .slice(0, 8)
    .reduce<Record<string, unknown>>((acc, field) => {
      acc[field.name] = buildExampleValue(field);
      return acc;
    }, {});

  return {
    create: {
      dryRun: true,
      data: writeData,
    },
    update: {
      id: "<record-id>",
      dryRun: true,
      data: writeData,
    },
  };
}

function buildFileStorageFileWriteExamples(fields: IContentFieldDescriptor[]) {
  return {
    ...buildWriteExamples(fields),
    createFromUrl: {
      dryRun: true,
      data: {
        url: "https://example.com/image.webp",
        adminTitle: "Image title",
        alt: "Image alt text",
      },
    },
    uploadBase64: {
      dryRun: true,
      data: {
        fileName: "image.webp",
        mimeType: "image/webp",
        contentBase64: "<base64-without-data-url-prefix>",
        adminTitle: "Image title",
        alt: "Image alt text",
      },
    },
  };
}

function buildEntityWriteExamples(descriptor: IContentEntityDescriptor) {
  if (descriptor.key === "file-storage.file") {
    return buildFileStorageFileWriteExamples(descriptor.fields);
  }

  return buildWriteExamples(descriptor.fields);
}

function buildFilterExamples(fields: IContentFieldDescriptor[]) {
  const idField = fields.find((field) => field.name === "id") ?? fields[0];

  if (!idField) {
    return [];
  }

  return [
    {
      filters: {
        and: [
          {
            column: idField.name,
            method: "eq",
            value: `<${idField.name}>`,
          },
        ],
      },
      limit: 1,
    },
  ];
}

async function loadContentEntityDescriptor(
  ref: IContentEntityRef,
): Promise<IContentEntityDescriptor> {
  const [modelModule, serverModule] = (await Promise.all([
    import(ref.modelImportPath),
    import(ref.serverImportPath),
  ])) as [ISdkModelModule, ISdkServerModule];

  if (!modelModule.insertSchema || !modelModule.selectSchema) {
    throw new Error(
      `Validation error. ${ref.key} SDK model does not export insertSchema and selectSchema`,
    );
  }

  if (!serverModule.api) {
    throw new Error(
      `Validation error. ${ref.key} SDK server does not export api`,
    );
  }

  const { fields, localizedFields, relationFields } = buildFields({
    insertSchema: modelModule.insertSchema,
    selectSchema: modelModule.selectSchema,
  });

  return {
    key: ref.key,
    kind: ref.kind,
    module: ref.module,
    name: ref.name,
    route: modelModule.route ?? "",
    title: `${toLabel(ref.module)} ${ref.label}`,
    description: `${ref.label} ${ref.kind} from ${ref.module} module.`,
    variants: modelModule.variants ?? [],
    fields,
    localizedFields,
    relationFields,
    ...(modelModule.externalModules
      ? { externalModules: modelModule.externalModules }
      : {}),
    operations: ref.operations,
    insertSchema: modelModule.insertSchema,
    selectSchema: modelModule.selectSchema,
    api: serverModule.api,
  };
}

export async function listContentEntityDescriptors(
  registry?: IContentEntityDescriptor[],
) {
  if (registry) {
    return registry;
  }

  return await Promise.all(
    listContentEntityRefs().map((ref) =>
      requireContentEntityDescriptor(ref.key),
    ),
  );
}

export function summarizeContentModules(
  registry?: IContentEntityDescriptor[],
): IContentModuleSummary[] {
  const moduleMap = new Map<string, IContentModuleSummary>();
  const refs = registry
    ? registry.map(
        (descriptor): IContentEntityRef => ({
          key: descriptor.key,
          kind: descriptor.kind,
          module: descriptor.module,
          name: descriptor.name,
          label: toLabel(descriptor.name),
          modelImportPath: "",
          serverImportPath: "",
          operations: descriptor.operations,
        }),
      )
    : listContentEntityRefs();

  for (const ref of refs) {
    const moduleSummary =
      moduleMap.get(ref.module) ??
      ({
        id: ref.module,
        label: toLabel(ref.module),
        models: [],
        relations: [],
      } satisfies IContentModuleSummary);

    const entitySummary = {
      id: ref.name,
      label: ref.label,
      operations: ref.operations,
    };

    if (ref.kind === "model") {
      moduleSummary.models.push(entitySummary);
    } else {
      moduleSummary.relations.push(entitySummary);
    }

    moduleMap.set(ref.module, moduleSummary);
  }

  return Array.from(moduleMap.values()).map((moduleSummary) => ({
    ...moduleSummary,
    models: moduleSummary.models.sort((a, b) => a.id.localeCompare(b.id)),
    relations: moduleSummary.relations.sort((a, b) => a.id.localeCompare(b.id)),
  }));
}

export function summarizeContentEntity(
  descriptor: IContentEntityDescriptor,
): IContentEntitySummary {
  const selector =
    descriptor.kind === "model"
      ? { module: descriptor.module, model: descriptor.name }
      : { module: descriptor.module, relation: descriptor.name };

  return {
    ...selector,
    label: toLabel(descriptor.name),
    route: descriptor.route,
    description: descriptor.description,
    variants: descriptor.variants,
    fields: descriptor.fields,
    requiredFields: descriptor.fields
      .filter((field) => field.required)
      .map((field) => field.name),
    writableFields: descriptor.fields
      .filter((field) => field.writable)
      .map((field) => field.name),
    localizedFields: descriptor.localizedFields,
    relationFields: descriptor.relationFields,
    ...(descriptor.externalModules
      ? { externalModules: descriptor.externalModules }
      : {}),
    operations: descriptor.operations,
    filterExamples: buildFilterExamples(descriptor.fields),
    writeExamples: buildEntityWriteExamples(descriptor),
  };
}

export async function getContentEntityDescriptor(
  key: IContentEntityKey,
  registry?: IContentEntityDescriptor[],
) {
  if (registry) {
    return registry.find((descriptor) => descriptor.key === key);
  }

  const ref = listContentEntityRefs().find(
    (entityRef) => entityRef.key === key,
  );

  if (!ref) {
    return;
  }

  if (!descriptorCache.has(key)) {
    descriptorCache.set(key, loadContentEntityDescriptor(ref));
  }

  return await descriptorCache.get(key);
}

export async function requireContentEntityDescriptor(
  key: IContentEntityKey,
  registry?: IContentEntityDescriptor[],
) {
  const descriptor = await getContentEntityDescriptor(key, registry);

  if (!descriptor) {
    throw new Error(`Not Found error. Content entity '${key}' not found`);
  }

  return descriptor;
}

export async function requireContentModelDescriptor(
  props: { module: string; model: string },
  registry?: IContentEntityDescriptor[],
) {
  const descriptor = await requireContentEntityDescriptor(
    `${props.module}.${props.model}`,
    registry,
  );

  if (descriptor.kind !== "model") {
    throw new Error(
      `Validation error. ${props.module}.${props.model} is not a model`,
    );
  }

  return descriptor;
}

export async function requireContentRelationDescriptor(
  props: { module: string; relation: string },
  registry?: IContentEntityDescriptor[],
) {
  const descriptor = await requireContentEntityDescriptor(
    `${props.module}.${props.relation}`,
    registry,
  );

  if (descriptor.kind !== "relation") {
    throw new Error(
      `Validation error. ${props.module}.${props.relation} is not a relation`,
    );
  }

  return descriptor;
}
