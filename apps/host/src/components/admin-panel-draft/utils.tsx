import type {
  AdminState,
  DrawerPanel,
  GenericEntity,
  ModuleItem,
  ProductArticleRelation,
  ProductAttributeRelation,
  RelationMap,
  RelationPaging,
  RelationQuery,
  RelationType,
} from "./interface";

export const modules: ModuleItem[] = [
  { id: "ecommerce", name: "Ecommerce", icon: "🛍️" },
];

export const modelsByModule: Record<string, string[]> = {
  ecommerce: ["product", "attribute"],
};

const baseModelEntities: Record<string, GenericEntity[]> = {
  product: [],
  attribute: [],
};

export const emptyRelations: RelationMap = {
  "products-to-attributes": [],
  "products-to-articles": [],
};

export function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function formatLabel(value: string): string {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function testIdPart(value: string | number | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tid(
  prefix: string,
  ...parts: Array<string | number | null | undefined>
) {
  return [prefix, ...parts.map(testIdPart)].filter(Boolean).join("--");
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildPanel(
  entity: GenericEntity,
  modelName: string,
  moduleId: string,
  mode: "create" | "edit" = "edit",
  sourceRelations?: RelationMap,
): DrawerPanel {
  return {
    moduleId,
    modelName,
    entityId: entity.id,
    mode,
    formData: cloneValue(entity),
    activeTab: "details",
    activeRelationTab: "products-to-attributes",
    relations: cloneValue(sourceRelations || emptyRelations),
    relationPaging: {
      "products-to-attributes": {
        currentPage: 1,
        itemsPerPage: 1,
      },
      "products-to-articles": {
        currentPage: 1,
        itemsPerPage: 1,
      },
    },
    relationQuery: {
      "products-to-attributes": {
        search: "",
        field: "all",
      },
      "products-to-articles": {
        search: "",
        field: "all",
      },
    },
  };
}

export function createEmptyEntityByModel(modelName: string): GenericEntity {
  const id = generateId();

  const base: GenericEntity = {
    id,
    adminTitle: `New ${formatLabel(modelName)}`,
    slug: "",
    variant: "default",
    type: modelName,
  };

  if (modelName === "product") {
    return {
      ...base,
      title: "",
      titleRu: "",
      shortDescription: "",
      shortDescriptionRu: "",
      type: "one_off",
    };
  }

  if (modelName === "attribute") {
    return {
      ...base,
      title: "",
      titleRu: "",
      number: undefined,
      boolean: false,
      type: "attribute",
    };
  }

  return base;
}

export function createInitialState(): AdminState {
  return {
    selectedModule: "ecommerce",
    expandedModule: "ecommerce",
    selectedModel: "product",
    viewMode: "module",
    modelSearch: "",
    modelEntities: cloneValue(baseModelEntities),
    drawerStack: [],
    relationEditor: {
      open: false,
      mode: "create",
      relationType: "",
      targetRelationId: null,
      ownerDepth: null,
      formData: null,
    },
    previewDialog: {
      open: false,
      modelName: "",
      entityId: "",
      viewport: "lg",
    },
    confirmDialog: {
      open: false,
      actionType: "",
      title: "",
      description: "",
      confirmLabel: "Delete",
      payload: null,
    },
  };
}

export function ensureModelInModule(state: AdminState) {
  const currentModels = modelsByModule[state.selectedModule] || [];

  if (!currentModels.includes(state.selectedModel)) {
    state.selectedModel = currentModels[0] || "";
  }

  if (!state.expandedModule) {
    state.expandedModule = state.selectedModule;
  }
}

export function getModuleByModel(modelName: string): string | null {
  const match = modules.find((moduleItem) =>
    (modelsByModule[moduleItem.id] || []).includes(modelName),
  );

  return match?.id || null;
}

export function applyRoute(pathLike: string, state: AdminState) {
  const normalized = pathLike.startsWith("/") ? pathLike : `/${pathLike}`;

  const modelMatch = normalized.match(/^\/modules\/([^/]+)\/models\/([^/]+)$/);
  if (modelMatch) {
    const [, moduleId, modelName] = modelMatch;
    const moduleExists = modules.some((item) => item.id === moduleId);
    const modelExists = (modelsByModule[moduleId] || []).includes(modelName);

    if (moduleExists && modelExists) {
      state.selectedModule = moduleId;
      state.expandedModule = moduleId;
      state.selectedModel = modelName;
      state.viewMode = "model";
    }

    return;
  }

  const moduleMatch = normalized.match(/^\/modules\/([^/]+)$/);
  if (moduleMatch) {
    const [, moduleId] = moduleMatch;
    const moduleExists = modules.some((item) => item.id === moduleId);

    if (moduleExists) {
      state.selectedModule = moduleId;
      state.expandedModule = moduleId;
      state.viewMode = "module";
      ensureModelInModule(state);
    }
  }
}

export function ensureRelationPaging(
  panel: DrawerPanel,
  relationType: RelationType,
  totalItemsOverride?: number,
) {
  if (!panel.relationPaging[relationType]) {
    panel.relationPaging[relationType] = {
      currentPage: 1,
      itemsPerPage: 1,
    };
  }

  const paging = panel.relationPaging[relationType] as RelationPaging;
  const parsedItemsPerPage = Number(paging.itemsPerPage);
  paging.itemsPerPage = Number.isFinite(parsedItemsPerPage)
    ? Math.max(1, parsedItemsPerPage)
    : 1;

  const totalItems =
    typeof totalItemsOverride === "number"
      ? totalItemsOverride
      : (panel.relations[relationType] || []).length;

  const totalPages = Math.max(1, Math.ceil(totalItems / paging.itemsPerPage));
  paging.currentPage = Math.max(
    1,
    Math.min(totalPages, Number(paging.currentPage || 1)),
  );

  return paging;
}

export function ensureRelationQuery(
  panel: DrawerPanel,
  relationType: RelationType,
) {
  if (!panel.relationQuery[relationType]) {
    panel.relationQuery[relationType] = {
      search: "",
      field: "all",
    };
  }

  return panel.relationQuery[relationType] as RelationQuery;
}

export function getRelationSearchMap(
  relationType: RelationType,
  relation: ProductAttributeRelation | ProductArticleRelation,
  panel: DrawerPanel,
) {
  if (relationType === "products-to-attributes") {
    const item = relation as ProductAttributeRelation;
    return {
      id: item.id,
      productId: panel.entityId,
      attributeId: item.attribute?.id,
      variant: item.variant,
      className: item.className,
      orderIndex: item.orderIndex,
    };
  }

  const item = relation as ProductArticleRelation;
  return {
    id: item.id,
    articleId: item.article?.id,
    slug: item.article?.slug,
    variant: item.variant,
    className: item.className,
    orderIndex: item.orderIndex,
  };
}

export function getFilteredRelationList(
  panel: DrawerPanel,
  relationType: RelationType,
) {
  const list = panel.relations[relationType] || [];
  const query = ensureRelationQuery(panel, relationType);

  const search = String(query.search || "")
    .trim()
    .toLowerCase();
  const field = query.field || "all";

  if (!search) {
    return list;
  }

  return list.filter((relation) => {
    const searchMap = getRelationSearchMap(relationType, relation, panel);

    if (field !== "all") {
      return String(searchMap[field as keyof typeof searchMap] ?? "")
        .toLowerCase()
        .includes(search);
    }

    return Object.values(searchMap).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );
  });
}

export function getRelationPageData(
  panel: DrawerPanel,
  relationType: RelationType,
) {
  const list = getFilteredRelationList(panel, relationType);
  const paging = ensureRelationPaging(panel, relationType, list.length);

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / paging.itemsPerPage));
  const startIndex = (paging.currentPage - 1) * paging.itemsPerPage;
  const items = list.slice(startIndex, startIndex + paging.itemsPerPage);

  return {
    list,
    items,
    startIndex,
    totalItems,
    totalPages,
    currentPage: paging.currentPage,
    itemsPerPage: paging.itemsPerPage,
  };
}

export function getRelationFilterOptions(relationType: RelationType) {
  if (relationType !== "products-to-attributes") {
    return [{ value: "all", label: "All fields" }];
  }

  return [
    { value: "all", label: "All fields" },
    { value: "id", label: "ID" },
    { value: "productId", label: "Product ID" },
    { value: "attributeId", label: "Attribute ID" },
    { value: "variant", label: "Variant" },
    { value: "className", label: "Class Name" },
    { value: "orderIndex", label: "Order Index" },
  ];
}

export function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getRelationEntityLabel(
  relationType: RelationType,
  entity: {
    id: string;
    title: string;
    number?: number;
    slug?: string;
    type?: string;
  },
) {
  if (relationType === "products-to-attributes") {
    return `${entity.title} | ${entity.type || ""} | Number: ${toNumberValue(
      entity.number,
      0,
    )}`;
  }

  return `${entity.title} | ${entity.slug}`;
}

export function getRelationTabs(panel: DrawerPanel) {
  const tabs: Array<{
    key: RelationType;
    label: string;
  }> = [
    {
      key: "products-to-attributes",
      label: "Attributes",
    },
  ];

  return tabs.map((tab) => ({
    ...tab,
    count: (panel.relations[tab.key] || []).length,
  }));
}

export function ensureActiveRelationTab(panel: DrawerPanel) {
  const tabs = getRelationTabs(panel);
  const hasActive = tabs.some((tab) => tab.key === panel.activeRelationTab);

  if (!hasActive) {
    panel.activeRelationTab = tabs[0]?.key || "products-to-attributes";
  }
}

export function getPreviewEntity(state: AdminState): GenericEntity | null {
  if (!state.previewDialog.open) {
    return null;
  }

  const entities = state.modelEntities[state.previewDialog.modelName] || [];
  return (
    entities.find((item) => item.id === state.previewDialog.entityId) || null
  );
}

export function mapProductToEntity(item: any): GenericEntity {
  const titleMap =
    item?.title && typeof item.title === "object" ? item.title : {};
  const shortDescriptionMap =
    item?.shortDescription && typeof item.shortDescription === "object"
      ? item.shortDescription
      : {};
  const descriptionMap =
    item?.description && typeof item.description === "object"
      ? item.description
      : {};

  return {
    id: String(item?.id || ""),
    adminTitle: String(item?.adminTitle || ""),
    title: String(titleMap?.en || ""),
    titleRu: String(titleMap?.ru || ""),
    shortDescription: String(shortDescriptionMap?.en || ""),
    shortDescriptionRu: String(shortDescriptionMap?.ru || ""),
    slug: String(item?.slug || ""),
    variant: String(item?.variant || "default"),
    type: String(item?.type || "one_off"),
    titleIntl: titleMap,
    shortDescriptionIntl: shortDescriptionMap,
    descriptionIntl: descriptionMap,
    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
  };
}

export function mapAttributeToEntity(item: any): GenericEntity {
  const stringMap =
    item?.string && typeof item.string === "object" ? item.string : {};

  return {
    id: String(item?.id || ""),
    adminTitle: String(item?.adminTitle || ""),
    title: String(stringMap?.en || ""),
    titleRu: String(stringMap?.ru || ""),
    slug: String(item?.slug || ""),
    variant: String(item?.variant || "default"),
    type: "attribute",
    number: item?.number,
    boolean: item?.boolean,
    date: item?.date,
    datetime: item?.datetime,
    stringIntl: stringMap,
    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
  };
}

export function areEntityListsEqual(
  left: GenericEntity[],
  right: GenericEntity[],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftItem = left[index];
    const rightItem = right[index];

    if (!leftItem || !rightItem) {
      return false;
    }

    if (
      leftItem.id !== rightItem.id ||
      leftItem.adminTitle !== rightItem.adminTitle ||
      leftItem.slug !== rightItem.slug ||
      leftItem.variant !== rightItem.variant ||
      leftItem.updatedAt !== rightItem.updatedAt
    ) {
      return false;
    }
  }

  return true;
}

export function areProductAttributeRelationsEqual(
  left: ProductAttributeRelation[],
  right: ProductAttributeRelation[],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftItem = left[index];
    const rightItem = right[index];

    if (!leftItem || !rightItem) {
      return false;
    }

    if (
      leftItem.id !== rightItem.id ||
      leftItem.orderIndex !== rightItem.orderIndex ||
      String(leftItem.className || "") !== String(rightItem.className || "") ||
      String(leftItem.variant || "") !== String(rightItem.variant || "") ||
      leftItem.attribute?.id !== rightItem.attribute?.id
    ) {
      return false;
    }
  }

  return true;
}
