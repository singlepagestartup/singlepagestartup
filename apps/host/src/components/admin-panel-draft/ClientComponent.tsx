"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Provider as EcommerceProvider,
  api as productApi,
} from "@sps/ecommerce/models/product/sdk/client";
import { api as attributeApi } from "@sps/ecommerce/models/attribute/sdk/client";
import { api as productsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/client";
import { Component as PanelComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/panel/Component";
import { Component as TableRowComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";
import { Component as FormComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { Component as TableControllerComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-controller/Component";
import { Component as TableComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table/Component";

type ViewMode = "module" | "model";
type EntityTab = "details" | "relations";
type RelationType = "products-to-attributes" | "products-to-articles";
type RelationTab = RelationType;
type CopyFeedbackMap = Record<string, boolean>;

type ModuleItem = {
  id: string;
  name: string;
  icon: string;
};

type GenericEntity = {
  id: string;
  adminTitle?: string;
  title?: string;
  titleRu?: string;
  shortDescription?: string;
  shortDescriptionRu?: string;
  slug?: string;
  type?: string;
  variant?: string;
  subtitle?: string;
  [key: string]: any;
};

type ProductAttributeRelation = {
  id: string;
  orderIndex: number;
  className?: string;
  variant?: string;
  attribute: {
    id: string;
    title: string;
    number: number;
  };
};

type ProductArticleRelation = {
  id: string;
  orderIndex: number;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  className?: string;
  variant?: string;
};

type RelationMap = {
  "products-to-attributes": ProductAttributeRelation[];
  "products-to-articles": ProductArticleRelation[];
};

type RelationPaging = {
  currentPage: number;
  itemsPerPage: number;
};

type RelationQuery = {
  search: string;
  field: string;
};

type DrawerPanel = {
  moduleId: string;
  modelName: string;
  entityId: string;
  mode: "create" | "edit";
  formData: GenericEntity;
  activeTab: EntityTab;
  activeRelationTab: RelationTab;
  relations: RelationMap;
  relationPaging: Partial<Record<RelationType, RelationPaging>>;
  relationQuery: Partial<Record<RelationType, RelationQuery>>;
};

type RelationEditorState = {
  open: boolean;
  mode: "create" | "edit";
  relationType: RelationType | "";
  targetRelationId: string | null;
  ownerDepth: number | null;
  formData: {
    orderIndex: number;
    className: string;
    variant: string;
    selectedEntityId: string;
  } | null;
};

type PreviewDialogState = {
  open: boolean;
  modelName: string;
  entityId: string;
  viewport: "2xl" | "lg" | "xs";
};

type ConfirmDialogState = {
  open: boolean;
  actionType:
    | ""
    | "entity-delete"
    | "relation-delete"
    | "settings-operation"
    | "identity-operation"
    | "identity-delete"
    | "logout-account";
  title: string;
  description: string;
  confirmLabel: string;
  payload: any;
};

type AdminState = {
  sidebarOpen: boolean;
  selectedModule: string;
  expandedModule: string;
  selectedModel: string;
  viewMode: ViewMode;
  modelSearch: string;
  entitySearch: string;
  sortBy: "id" | "title" | "slug";
  currentPage: number;
  itemsPerPage: number;
  modelEntities: Record<string, GenericEntity[]>;
  drawerStack: DrawerPanel[];
  relationEditor: RelationEditorState;
  previewDialog: PreviewDialogState;
  confirmDialog: ConfirmDialogState;
};

const modules: ModuleItem[] = [
  { id: "ecommerce", name: "Ecommerce", icon: "🛍️" },
];

const modelsByModule: Record<string, string[]> = {
  ecommerce: ["product", "attribute"],
};

const baseModelEntities: Record<string, GenericEntity[]> = {
  product: [],
  attribute: [],
};

const emptyRelations: RelationMap = {
  "products-to-attributes": [],
  "products-to-articles": [],
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function formatLabel(value: string): string {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function testIdPart(value: string | number | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function tid(
  prefix: string,
  ...parts: Array<string | number | null | undefined>
) {
  return [prefix, ...parts.map(testIdPart)].filter(Boolean).join("--");
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildPanel(
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

function createEmptyEntityByModel(modelName: string): GenericEntity {
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

function createInitialState(): AdminState {
  return {
    sidebarOpen: true,
    selectedModule: "ecommerce",
    expandedModule: "ecommerce",
    selectedModel: "product",
    viewMode: "module",
    modelSearch: "",
    entitySearch: "",
    sortBy: "id",
    currentPage: 1,
    itemsPerPage: 4,
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

function ensureModelInModule(state: AdminState) {
  const currentModels = modelsByModule[state.selectedModule] || [];

  if (!currentModels.includes(state.selectedModel)) {
    state.selectedModel = currentModels[0] || "";
  }

  if (!state.expandedModule) {
    state.expandedModule = state.selectedModule;
  }
}

function getModuleByModel(modelName: string): string | null {
  const match = modules.find((moduleItem) =>
    (modelsByModule[moduleItem.id] || []).includes(modelName),
  );

  return match?.id || null;
}

function applyRoute(pathLike: string, state: AdminState) {
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

function ensureRelationPaging(
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

function ensureRelationQuery(panel: DrawerPanel, relationType: RelationType) {
  if (!panel.relationQuery[relationType]) {
    panel.relationQuery[relationType] = {
      search: "",
      field: "all",
    };
  }

  return panel.relationQuery[relationType] as RelationQuery;
}

function getRelationSearchMap(
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

function getFilteredRelationList(
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

function getRelationPageData(panel: DrawerPanel, relationType: RelationType) {
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

function getRelationFilterOptions(relationType: RelationType) {
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

function getRelationEntityLabel(
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

function getRelationTabs(panel: DrawerPanel) {
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

function ensureActiveRelationTab(panel: DrawerPanel) {
  const tabs = getRelationTabs(panel);
  const hasActive = tabs.some((tab) => tab.key === panel.activeRelationTab);

  if (!hasActive) {
    panel.activeRelationTab = tabs[0]?.key || "products-to-attributes";
  }
}

function getPreviewEntity(state: AdminState): GenericEntity | null {
  if (!state.previewDialog.open) {
    return null;
  }

  const entities = state.modelEntities[state.previewDialog.modelName] || [];
  return (
    entities.find((item) => item.id === state.previewDialog.entityId) || null
  );
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapProductToEntity(item: any): GenericEntity {
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

function mapAttributeToEntity(item: any): GenericEntity {
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

function areEntityListsEqual(left: GenericEntity[], right: GenericEntity[]) {
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

function areProductAttributeRelationsEqual(
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

type IAdminPanelDraftProps = {
  className?: string;
  url: string;
  language: string;
};

function ClientComponentInner(props: IAdminPanelDraftProps) {
  const [state, setState] = useState<AdminState>(() => {
    const next = createInitialState();

    if (props.url.startsWith("/admin/modules/")) {
      const normalized = props.url.replace(/^\/admin/, "") || "/";
      applyRoute(normalized, next);
    }

    ensureModelInModule(next);

    return next;
  });
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedbackMap>({});
  const copyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const productsQuery = productApi.find({
    params: {
      offset: 0,
      limit: 1000,
    },
  });
  const attributesQuery = attributeApi.find({
    params: {
      offset: 0,
      limit: 1000,
    },
  });
  const productsToAttributesQuery = productsToAttributesApi.find({
    params: {
      offset: 0,
      limit: 1000,
    },
  });

  const createProductMutation = productApi.create();
  const updateProductMutation = productApi.update();
  const deleteProductMutation = productApi.delete();
  const createAttributeMutation = attributeApi.create();
  const updateAttributeMutation = attributeApi.update();
  const deleteAttributeMutation = attributeApi.delete();
  const createProductToAttributeMutation = productsToAttributesApi.create();
  const updateProductToAttributeMutation = productsToAttributesApi.update();
  const deleteProductToAttributeMutation = productsToAttributesApi.delete();

  const productEntities = useMemo(
    () => (productsQuery.data || []).map((item) => mapProductToEntity(item)),
    [productsQuery.data],
  );
  const attributeEntities = useMemo(
    () =>
      (attributesQuery.data || []).map((item) => mapAttributeToEntity(item)),
    [attributesQuery.data],
  );

  const attributeEntityById = useMemo(() => {
    return new Map(attributeEntities.map((item) => [item.id, item]));
  }, [attributeEntities]);

  const productsToAttributesByProductId = useMemo(() => {
    const map = new Map<string, ProductAttributeRelation[]>();
    const rawRelations = productsToAttributesQuery.data || [];

    for (const relation of rawRelations as Array<any>) {
      const productId = String(relation?.productId || "");
      const attributeId = String(relation?.attributeId || "");
      const attribute = attributeEntityById.get(attributeId);

      const nextItem: ProductAttributeRelation = {
        id: String(relation?.id || ""),
        orderIndex: toNumberValue(relation?.orderIndex, 0),
        className: String(relation?.className || ""),
        variant: String(relation?.variant || "default"),
        attribute: {
          id: attributeId,
          title:
            String(attribute?.title || attribute?.adminTitle || "") ||
            attributeId,
          number: toNumberValue(attribute?.number, 0),
        },
      };

      if (!map.has(productId)) {
        map.set(productId, []);
      }

      map.get(productId)?.push(nextItem);
    }

    for (const [, list] of map) {
      list.sort(
        (left, right) =>
          Number(left?.orderIndex || 0) - Number(right?.orderIndex || 0),
      );
    }

    return map;
  }, [attributeEntityById, productsToAttributesQuery.data]);

  const getPanelRelationsByModel = useCallback(
    (modelName: string, entityId: string): RelationMap => {
      const relations = cloneValue(emptyRelations);

      if (modelName === "product") {
        relations["products-to-attributes"] = cloneValue(
          productsToAttributesByProductId.get(entityId) || [],
        );
      }

      return relations;
    },
    [productsToAttributesByProductId],
  );

  const buildPanelForEntity = useCallback(
    (
      entity: GenericEntity,
      modelName: string,
      moduleId: string,
      mode: "create" | "edit" = "edit",
    ) => {
      return buildPanel(
        entity,
        modelName,
        moduleId,
        mode,
        getPanelRelationsByModel(modelName, entity.id),
      );
    },
    [getPanelRelationsByModel],
  );

  const availableRelationEntities = useMemo(() => {
    return attributeEntities.map((attribute) => ({
      id: attribute.id,
      title: attribute.title || attribute.adminTitle || attribute.id,
      number: toNumberValue(attribute.number, 0),
      type: "Attribute",
      slug: attribute.slug,
    }));
  }, [attributeEntities]);

  useEffect(() => {
    setState((previous) => {
      const next = cloneValue(previous);
      let isChanged = false;

      const currentProducts = next.modelEntities.product || [];
      if (!areEntityListsEqual(currentProducts, productEntities)) {
        next.modelEntities.product = productEntities;
        isChanged = true;
      }

      const currentAttributes = next.modelEntities.attribute || [];
      if (!areEntityListsEqual(currentAttributes, attributeEntities)) {
        next.modelEntities.attribute = attributeEntities;
        isChanged = true;
      }

      if (!next.drawerStack.length) {
        return isChanged ? next : previous;
      }

      const refreshedDrawerStack = next.drawerStack.map((panel) => {
        if (panel.modelName !== "product") {
          return panel;
        }

        const nextRelations = getPanelRelationsByModel(
          panel.modelName,
          panel.entityId,
        )["products-to-attributes"];
        const currentRelations =
          panel.relations["products-to-attributes"] || [];

        if (
          areProductAttributeRelationsEqual(currentRelations, nextRelations)
        ) {
          return panel;
        }

        isChanged = true;
        return {
          ...panel,
          relations: {
            ...panel.relations,
            "products-to-attributes": nextRelations,
          },
        };
      });

      if (isChanged) {
        next.drawerStack = refreshedDrawerStack;
      }

      return isChanged ? next : previous;
    });
  }, [attributeEntities, getPanelRelationsByModel, productEntities]);

  const currentModule = useMemo(
    () => modules.find((item) => item.id === state.selectedModule),
    [state.selectedModule],
  );

  const currentModuleModels = useMemo(
    () => modelsByModule[state.selectedModule] || [],
    [state.selectedModule],
  );

  const isModuleView = state.viewMode === "module";
  const filteredEntities = useMemo(() => {
    if (isModuleView) {
      return [] as GenericEntity[];
    }

    const source = [...(state.modelEntities[state.selectedModel] || [])];
    const searchLower = state.entitySearch.trim().toLowerCase();

    source.sort((a, b) => {
      if (state.sortBy === "title") {
        return (a.adminTitle || a.title || "")
          .toString()
          .localeCompare((b.adminTitle || b.title || "").toString());
      }

      if (state.sortBy === "slug") {
        return (a.slug || "")
          .toString()
          .localeCompare((b.slug || "").toString());
      }

      return (a.id || "").toString().localeCompare((b.id || "").toString());
    });

    if (!searchLower) {
      return source;
    }

    return source.filter((entity) =>
      [
        entity.id,
        entity.adminTitle,
        entity.title,
        entity.slug,
        entity.shortDescription,
        entity.shortDescriptionRu,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchLower)),
    );
  }, [
    isModuleView,
    state.entitySearch,
    state.modelEntities,
    state.selectedModel,
    state.sortBy,
  ]);

  const totalPages = useMemo(() => {
    if (isModuleView) {
      return 1;
    }

    return Math.max(1, Math.ceil(filteredEntities.length / state.itemsPerPage));
  }, [filteredEntities.length, isModuleView, state.itemsPerPage]);

  const pagedEntities = useMemo(() => {
    if (isModuleView) {
      return [] as GenericEntity[];
    }

    const currentPage = Math.min(state.currentPage, totalPages);
    const startIndex = (currentPage - 1) * state.itemsPerPage;

    return filteredEntities.slice(startIndex, startIndex + state.itemsPerPage);
  }, [
    filteredEntities,
    isModuleView,
    state.currentPage,
    state.itemsPerPage,
    totalPages,
  ]);

  const topDepth = state.drawerStack.length - 1;
  const topPanel = topDepth > -1 ? state.drawerStack[topDepth] : null;
  const relationOwnerPanel =
    state.relationEditor.ownerDepth !== null
      ? state.drawerStack[state.relationEditor.ownerDepth]
      : null;

  const syncHashWithState = useCallback((currentState: AdminState) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash =
      currentState.viewMode === "module"
        ? `#/modules/${currentState.selectedModule}`
        : `#/modules/${currentState.selectedModule}/models/${currentState.selectedModel}`;

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setState((previous) => {
        const next = cloneValue(previous);
        const routeFromHash =
          (window.location.hash || "").replace(/^#/, "") || "/";
        applyRoute(routeFromHash, next);
        ensureModelInModule(next);
        return next;
      });
    };

    if (window.location.hash) {
      onHashChange();
    }

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    syncHashWithState(state);
  }, [state, syncHashWithState]);

  useEffect(() => {
    return () => {
      Object.values(copyTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const applyCopyFeedback = useCallback((value?: string) => {
    if (!value) {
      return;
    }

    const key = String(value);

    if (copyTimers.current[key]) {
      clearTimeout(copyTimers.current[key]);
    }

    setCopyFeedback((previous) => ({
      ...previous,
      [key]: true,
    }));

    copyTimers.current[key] = setTimeout(() => {
      setCopyFeedback((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
      delete copyTimers.current[key];
    }, 1000);
  }, []);

  const copyToClipboard = useCallback(
    async (value?: string) => {
      if (!value) {
        return;
      }

      const copyText = String(value);

      const legacyCopy = () => {
        if (typeof document === "undefined") {
          return false;
        }

        const textarea = document.createElement("textarea");
        textarea.value = copyText;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      };

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(copyText);
          applyCopyFeedback(copyText);
          return;
        }
      } catch {
        // fallback below
      }

      if (legacyCopy()) {
        applyCopyFeedback(copyText);
      }
    },
    [applyCopyFeedback],
  );

  const setRelationEditorClosed = useCallback((nextState: AdminState) => {
    nextState.relationEditor = {
      open: false,
      mode: "create",
      relationType: "",
      targetRelationId: null,
      ownerDepth: null,
      formData: null,
    };
  }, []);

  const setPreviewDialogClosed = useCallback((nextState: AdminState) => {
    nextState.previewDialog = {
      open: false,
      modelName: "",
      entityId: "",
      viewport: "lg",
    };
  }, []);

  const setConfirmDialogClosed = useCallback((nextState: AdminState) => {
    nextState.confirmDialog = {
      open: false,
      actionType: "",
      title: "",
      description: "",
      confirmLabel: "Delete",
      payload: null,
    };
  }, []);

  const openConfirmDialog = useCallback(
    (config: {
      actionType: ConfirmDialogState["actionType"];
      title: string;
      description: string;
      confirmLabel: string;
      payload: any;
    }) => {
      setState((previous) => {
        const next = cloneValue(previous);
        next.confirmDialog = {
          open: true,
          actionType: config.actionType,
          title: config.title,
          description: config.description,
          confirmLabel: config.confirmLabel,
          payload: config.payload,
        };
        return next;
      });
    },
    [],
  );

  const openEntityPanel = useCallback(
    (
      entity: GenericEntity,
      options: {
        append: boolean;
        modelName: string;
        moduleId: string;
        mode?: "create" | "edit";
      },
    ) => {
      setState((previous) => {
        const next = cloneValue(previous);
        const panel = buildPanelForEntity(
          entity,
          options.modelName,
          options.moduleId,
          options.mode || "edit",
        );

        if (options.append) {
          next.drawerStack.push(panel);
        } else {
          next.drawerStack = [panel];
        }

        setRelationEditorClosed(next);
        return next;
      });
    },
    [buildPanelForEntity, setRelationEditorClosed],
  );

  const openEntityEditorById = useCallback(
    (
      id: string | null,
      options?: { append?: boolean; modelName?: string; moduleId?: string },
    ) => {
      if (!id) {
        return;
      }

      setState((previous) => {
        const next = cloneValue(previous);

        const modelName = options?.modelName || next.selectedModel;
        const moduleId = options?.moduleId || next.selectedModule;
        const append = Boolean(options?.append);

        const entity = (next.modelEntities[modelName] || []).find(
          (item) => item.id === id,
        );
        if (!entity) {
          return previous;
        }

        const panel = buildPanelForEntity(entity, modelName, moduleId, "edit");

        if (append) {
          next.drawerStack.push(panel);
        } else {
          next.drawerStack = [panel];
        }

        setRelationEditorClosed(next);
        return next;
      });
    },
    [buildPanelForEntity, setRelationEditorClosed],
  );

  const closeTopEntityPanel = useCallback(() => {
    setState((previous) => {
      if (!previous.drawerStack.length) {
        return previous;
      }

      const next = cloneValue(previous);
      const currentTopDepth = next.drawerStack.length - 1;
      next.drawerStack.pop();

      if (
        next.relationEditor.open &&
        next.relationEditor.ownerDepth !== null &&
        next.relationEditor.ownerDepth >= currentTopDepth
      ) {
        setRelationEditorClosed(next);
      }

      return next;
    });
  }, [setRelationEditorClosed]);

  const closeRelationDrawer = useCallback(() => {
    setState((previous) => {
      if (!previous.relationEditor.open) {
        return previous;
      }

      const next = cloneValue(previous);
      setRelationEditorClosed(next);
      return next;
    });
  }, [setRelationEditorClosed]);

  const openRelationDrawer = useCallback(
    (options: {
      mode: "create" | "edit";
      panelDepth?: number;
      relationType: RelationType;
      relationId?: string;
    }) => {
      setState((previous) => {
        const next = cloneValue(previous);

        const ownerDepth =
          typeof options.panelDepth === "number"
            ? options.panelDepth
            : next.drawerStack.length - 1;

        const panel = next.drawerStack[ownerDepth];
        if (!panel) {
          return previous;
        }

        const list = panel.relations[options.relationType] || [];

        if (options.mode === "edit") {
          const item = list.find((row) => row.id === options.relationId);
          if (!item) {
            return previous;
          }

          next.relationEditor = {
            open: true,
            mode: "edit",
            relationType: options.relationType,
            targetRelationId: options.relationId || null,
            ownerDepth,
            formData: {
              orderIndex: Number(item.orderIndex || 0),
              className: String(
                (item as ProductAttributeRelation).className || "",
              ),
              variant: String(
                (item as ProductAttributeRelation).variant || "default",
              ),
              selectedEntityId:
                options.relationType === "products-to-attributes"
                  ? String(
                      (item as ProductAttributeRelation).attribute?.id || "",
                    )
                  : String((item as ProductArticleRelation).article?.id || ""),
            },
          };

          return next;
        }

        next.relationEditor = {
          open: true,
          mode: "create",
          relationType: options.relationType,
          targetRelationId: null,
          ownerDepth,
          formData: {
            orderIndex: list.length,
            className: "",
            variant: "default",
            selectedEntityId: "",
          },
        };

        return next;
      });
    },
    [],
  );

  const moveRelation = useCallback(
    async (
      panelDepth: number,
      relationType: RelationType,
      relationId: string,
      direction: "up" | "down",
    ) => {
      if (relationType !== "products-to-attributes") {
        return;
      }

      let toPersist: Array<{
        id: string;
        data: {
          productId: string;
          attributeId: string;
          orderIndex: number;
          className: string;
          variant: string;
        };
      }> = [];

      setState((previous) => {
        const next = cloneValue(previous);
        const panel = next.drawerStack[panelDepth];
        if (!panel) {
          return previous;
        }

        const list = panel.relations[relationType] || [];
        const currentIndex = list.findIndex((item) => item.id === relationId);
        if (currentIndex < 0) {
          return previous;
        }

        const targetIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= list.length) {
          return previous;
        }

        const temp = list[currentIndex];
        list[currentIndex] = list[targetIndex];
        list[targetIndex] = temp;

        list.forEach((item, index) => {
          item.orderIndex = index;
        });

        toPersist = list.map((item) => ({
          id: String(item.id),
          data: {
            productId: panel.entityId,
            attributeId: String(item.attribute?.id || ""),
            orderIndex: Number(item.orderIndex || 0),
            className: String(item.className || ""),
            variant: String(item.variant || "default"),
          },
        }));

        return next;
      });

      if (!toPersist.length) {
        return;
      }

      try {
        await Promise.all(
          toPersist.map((entry) =>
            updateProductToAttributeMutation.mutateAsync({
              id: entry.id,
              data: entry.data,
            }),
          ),
        );
        await productsToAttributesQuery.refetch();
      } catch {
        // toast is handled by api factory layer
      }
    },
    [productsToAttributesQuery, updateProductToAttributeMutation],
  );

  const saveEntity = useCallback(async () => {
    const panel = state.drawerStack[state.drawerStack.length - 1];
    if (!panel) {
      return;
    }

    const fallbackSlug = `${panel.modelName}-${Date.now()}`;

    try {
      if (panel.modelName === "product") {
        const existing = (productsQuery.data || []).find(
          (item: any) => String(item?.id || "") === panel.entityId,
        ) as any;

        const data = {
          adminTitle:
            String(panel.formData.adminTitle || "").trim() ||
            String(panel.formData.title || "").trim() ||
            `New ${formatLabel(panel.modelName)}`,
          slug: String(panel.formData.slug || "").trim() || fallbackSlug,
          variant: String(panel.formData.variant || "default"),
          type: String(panel.formData.type || existing?.type || "one_off"),
          title: {
            ...(existing?.title && typeof existing.title === "object"
              ? existing.title
              : {}),
            en: String(panel.formData.title || ""),
            ru: String(panel.formData.titleRu || ""),
          },
          shortDescription: {
            ...(existing?.shortDescription &&
            typeof existing.shortDescription === "object"
              ? existing.shortDescription
              : {}),
            en: String(panel.formData.shortDescription || ""),
            ru: String(panel.formData.shortDescriptionRu || ""),
          },
          description:
            existing?.description && typeof existing.description === "object"
              ? existing.description
              : {},
        };

        if (panel.mode === "create") {
          await createProductMutation.mutateAsync({
            data,
          });
        } else {
          await updateProductMutation.mutateAsync({
            id: panel.entityId,
            data,
          });
        }

        await productsQuery.refetch();
      } else if (panel.modelName === "attribute") {
        const existing = (attributesQuery.data || []).find(
          (item: any) => String(item?.id || "") === panel.entityId,
        ) as any;

        const hasNumberValue =
          panel.formData.number !== undefined &&
          panel.formData.number !== null &&
          String(panel.formData.number).length > 0;

        const data = {
          adminTitle:
            String(panel.formData.adminTitle || "").trim() ||
            String(panel.formData.title || "").trim() ||
            `New ${formatLabel(panel.modelName)}`,
          slug: String(panel.formData.slug || "").trim() || fallbackSlug,
          variant: String(panel.formData.variant || "default"),
          string: {
            ...(existing?.string && typeof existing.string === "object"
              ? existing.string
              : {}),
            en: String(panel.formData.title || ""),
            ru: String(panel.formData.titleRu || ""),
          },
          number: hasNumberValue ? Number(panel.formData.number) : null,
          boolean:
            typeof panel.formData.boolean === "boolean"
              ? panel.formData.boolean
              : Boolean(existing?.boolean),
          date: panel.formData.date || existing?.date || null,
          datetime: panel.formData.datetime || existing?.datetime || null,
        };

        if (panel.mode === "create") {
          await createAttributeMutation.mutateAsync({
            data,
          });
        } else {
          await updateAttributeMutation.mutateAsync({
            id: panel.entityId,
            data,
          });
        }

        await attributesQuery.refetch();
      } else {
        return;
      }

      setState((previous) => {
        if (!previous.drawerStack.length) {
          return previous;
        }

        const next = cloneValue(previous);
        const depthBeforeClose = next.drawerStack.length - 1;
        next.drawerStack.pop();

        if (
          next.relationEditor.open &&
          next.relationEditor.ownerDepth !== null &&
          next.relationEditor.ownerDepth >= depthBeforeClose
        ) {
          setRelationEditorClosed(next);
        }

        return next;
      });
    } catch {
      // toast is handled by api factory layer
    }
  }, [
    attributesQuery,
    createAttributeMutation,
    createProductMutation,
    productsQuery,
    setRelationEditorClosed,
    state.drawerStack,
    updateAttributeMutation,
    updateProductMutation,
  ]);

  const saveRelation = useCallback(async () => {
    const rel = state.relationEditor;

    if (!rel.open || !rel.formData || !rel.relationType) {
      return;
    }

    const panel =
      rel.ownerDepth !== null && rel.ownerDepth >= 0
        ? state.drawerStack[rel.ownerDepth]
        : null;

    if (!panel || rel.relationType !== "products-to-attributes") {
      return;
    }

    const list = panel.relations[rel.relationType] || [];
    const targetRelation = list.find(
      (item) => item.id === rel.targetRelationId,
    );

    const selectedAttributeId =
      rel.mode === "create"
        ? String(rel.formData.selectedEntityId || "")
        : String(
            targetRelation?.attribute?.id || rel.formData.selectedEntityId,
          );

    if (!selectedAttributeId) {
      return;
    }

    const data = {
      productId: panel.entityId,
      attributeId: selectedAttributeId,
      orderIndex: Number(rel.formData.orderIndex || 0),
      className: String(rel.formData.className || ""),
      variant: String(rel.formData.variant || "default"),
    };

    try {
      if (rel.mode === "create") {
        await createProductToAttributeMutation.mutateAsync({
          data,
        });
      } else if (rel.targetRelationId) {
        await updateProductToAttributeMutation.mutateAsync({
          id: rel.targetRelationId,
          data,
        });
      }

      await productsToAttributesQuery.refetch();

      setState((previous) => {
        const next = cloneValue(previous);
        setRelationEditorClosed(next);
        return next;
      });
    } catch {
      // toast is handled by api factory layer
    }
  }, [
    createProductToAttributeMutation,
    productsToAttributesQuery,
    setRelationEditorClosed,
    state.drawerStack,
    state.relationEditor,
    updateProductToAttributeMutation,
  ]);

  const confirmAction = useCallback(async () => {
    const dialog = state.confirmDialog;
    if (!dialog.open) {
      return;
    }

    if (dialog.actionType === "entity-delete" && dialog.payload) {
      const modelName = String(dialog.payload.modelName || "");
      const id = String(dialog.payload.id || "");

      try {
        if (modelName === "product") {
          await deleteProductMutation.mutateAsync({ id });
          await productsQuery.refetch();
        } else if (modelName === "attribute") {
          await deleteAttributeMutation.mutateAsync({ id });
          await attributesQuery.refetch();
          await productsToAttributesQuery.refetch();
        }
      } catch {
        return;
      }

      setState((previous) => {
        const next = cloneValue(previous);

        next.modelEntities[modelName] = (
          next.modelEntities[modelName] || []
        ).filter((entity) => entity.id !== id);

        if (
          next.previewDialog.open &&
          next.previewDialog.modelName === modelName &&
          next.previewDialog.entityId === id
        ) {
          setPreviewDialogClosed(next);
        }

        next.drawerStack = next.drawerStack.filter(
          (panel) => !(panel.modelName === modelName && panel.entityId === id),
        );

        if (next.relationEditor.open && !next.drawerStack.length) {
          setRelationEditorClosed(next);
        }

        setConfirmDialogClosed(next);
        return next;
      });

      return;
    }

    if (dialog.actionType === "relation-delete" && dialog.payload) {
      const panelDepth = Number(dialog.payload.panelDepth);
      const relationType = String(dialog.payload.relationType) as RelationType;
      const relationId = String(dialog.payload.relationId);

      if (relationType !== "products-to-attributes") {
        setState((previous) => {
          const next = cloneValue(previous);
          setConfirmDialogClosed(next);
          return next;
        });
        return;
      }

      try {
        await deleteProductToAttributeMutation.mutateAsync({
          id: relationId,
        });
        await productsToAttributesQuery.refetch();
      } catch {
        return;
      }

      setState((previous) => {
        const next = cloneValue(previous);
        const panel = next.drawerStack[panelDepth];

        if (panel) {
          const filtered = (panel.relations[relationType] || []).filter(
            (item) => item.id !== relationId,
          );
          panel.relations[relationType] = filtered.map((item, index) => ({
            ...item,
            orderIndex: index,
          })) as any;
        }

        if (
          next.relationEditor.open &&
          next.relationEditor.targetRelationId === relationId
        ) {
          setRelationEditorClosed(next);
        }

        setConfirmDialogClosed(next);
        return next;
      });

      return;
    }

    setState((previous) => {
      const next = cloneValue(previous);
      setConfirmDialogClosed(next);
      return next;
    });
  }, [
    attributesQuery,
    deleteAttributeMutation,
    deleteProductMutation,
    deleteProductToAttributeMutation,
    productsQuery,
    productsToAttributesQuery,
    setConfirmDialogClosed,
    setRelationEditorClosed,
    state.confirmDialog,
  ]);

  const openPreviewDialog = useCallback(
    (modelName: string, entityId: string) => {
      setState((previous) => {
        const next = cloneValue(previous);
        next.previewDialog = {
          open: true,
          modelName: modelName || next.selectedModel,
          entityId: entityId || "",
          viewport: next.previewDialog.viewport || "lg",
        };
        return next;
      });
    },
    [],
  );

  const closePreviewDialog = useCallback(() => {
    setState((previous) => {
      if (!previous.previewDialog.open) {
        return previous;
      }

      const next = cloneValue(previous);
      setPreviewDialogClosed(next);
      return next;
    });
  }, [setPreviewDialogClosed]);

  const ensureEntityForRelated = useCallback(
    (currentState: AdminState, modelName: string, id: string) => {
      if (!currentState.modelEntities[modelName]) {
        currentState.modelEntities[modelName] = [];
      }

      let entity = currentState.modelEntities[modelName].find(
        (item) => item.id === id,
      );
      if (entity) {
        return entity;
      }

      entity = {
        id,
        adminTitle: `${formatLabel(modelName)} - ${id.slice(0, 8)}`,
        title: `Sample ${formatLabel(modelName)}`,
        titleRu: `Пример ${formatLabel(modelName)}`,
        shortDescription: "Auto-generated nested entity preview",
        shortDescriptionRu: "Автоматически созданный превью объект",
        slug: modelName.toLowerCase(),
        type: modelName.toLowerCase(),
        variant: "default",
      };

      currentState.modelEntities[modelName].push(entity);
      return entity;
    },
    [],
  );

  const openRelatedEntity = useCallback(
    (payload: { model: string; id: string }) => {
      setState((previous) => {
        const next = cloneValue(previous);
        const entity = ensureEntityForRelated(next, payload.model, payload.id);
        const moduleId = getModuleByModel(payload.model) || next.selectedModule;

        next.drawerStack.push(
          buildPanelForEntity(entity, payload.model, moduleId, "edit"),
        );
        setRelationEditorClosed(next);
        return next;
      });
    },
    [buildPanelForEntity, ensureEntityForRelated, setRelationEditorClosed],
  );

  const handleSelectModule = useCallback((moduleId: string) => {
    setState((previous) => {
      const next = cloneValue(previous);

      if (
        next.selectedModule === moduleId &&
        next.expandedModule === moduleId
      ) {
        next.expandedModule = "";
        return next;
      }

      next.selectedModule = moduleId;
      next.expandedModule = moduleId;
      next.viewMode = "module";
      next.entitySearch = "";
      next.modelSearch = "";
      next.currentPage = 1;
      ensureModelInModule(next);
      return next;
    });
  }, []);

  const handleSelectModel = useCallback(
    (_moduleId: string, modelName: string) => {
      setState((previous) => {
        const next = cloneValue(previous);
        next.selectedModel = modelName;
        next.viewMode = "model";
        next.currentPage = 1;
        next.entitySearch = "";
        return next;
      });
    },
    [],
  );

  const closeConfirmDialog = useCallback(() => {
    setState((previous) => {
      if (!previous.confirmDialog.open) {
        return previous;
      }

      const next = cloneValue(previous);
      setConfirmDialogClosed(next);
      return next;
    });
  }, [setConfirmDialogClosed]);

  const getPageTitle = () => {
    if (isModuleView) {
      return currentModule?.name || "Module";
    }

    return state.selectedModel;
  };

  const renderBreadcrumb = () => {
    if (isModuleView) {
      return null;
    }

    return (
      <div
        id="breadcrumb"
        data-testid="breadcrumb"
        className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <span>{currentModule?.name || ""}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">
          {state.selectedModel}
        </span>
      </div>
    );
  };

  const moduleOverviewCards = currentModuleModels.map((modelName) => {
    const total = (state.modelEntities[modelName] || []).length;

    return (
      <Card
        key={modelName}
        data-testid={tid("module-model-card", state.selectedModule, modelName)}
        className="rounded-lg border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold capitalize">
              {formatLabel(modelName)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{modelName}</p>
          </div>
          <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {total}
          </span>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Route</p>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-900">
            {modelName === "product"
              ? "/api/ecommerce/products"
              : modelName === "attribute"
                ? "/api/ecommerce/attributes"
                : `/api/${state.selectedModule}/${modelName}`}
          </p>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            data-testid={tid(
              "module-model-open",
              state.selectedModule,
              modelName,
            )}
            className="!w-full rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
            onClick={() => {
              setState((previous) => {
                const next = cloneValue(previous);
                next.selectedModel = modelName;
                next.viewMode = "model";
                next.currentPage = 1;
                next.entitySearch = "";
                return next;
              });
            }}
          >
            Open model
          </Button>
        </div>
      </Card>
    );
  });

  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      <div className="flex h-screen" data-testid="admin-prototype-root">
        <PanelComponent
          state={{
            sidebarOpen: state.sidebarOpen,
            selectedModule: state.selectedModule,
            expandedModule: state.expandedModule,
            selectedModel: state.selectedModel,
            modelSearch: state.modelSearch,
          }}
          showSettingsButton={false}
          modules={modules}
          modelsByModule={modelsByModule}
          isModuleView={isModuleView}
          isSettingsView={false}
          onSelectModule={handleSelectModule}
          onSelectModel={handleSelectModel}
          onOpenSettings={() => {}}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className="flex h-16 items-center border-b border-border bg-card px-6"
            data-testid="top-header"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Button
                id="toggleSidebarButton"
                data-testid="toggle-sidebar-button"
                type="button"
                variant="outline"
                size="icon"
                className="!w-10 rounded-md p-2 transition hover:bg-muted"
                aria-label="Toggle sidebar"
                onClick={() => {
                  setState((previous) => ({
                    ...previous,
                    sidebarOpen: !previous.sidebarOpen,
                  }));
                }}
              >
                {state.sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-testid="help-button"
                className="!w-10 rounded-md p-2 transition hover:bg-muted"
                aria-label="Help"
              >
                <CircleHelp className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main
            className="flex-1 overflow-auto bg-background p-6"
            data-testid="main-content"
          >
            <div className="mx-auto max-w-7xl space-y-4">
              <div>
                {renderBreadcrumb()}
                <h1
                  id="pageTitle"
                  data-testid="page-title"
                  className="text-3xl font-bold tracking-tight capitalize"
                >
                  {getPageTitle()}
                </h1>
              </div>

              <TableControllerComponent
                isServer={false}
                headless
                module={state.selectedModule}
                name="ecommerce-model-view"
                variant="find"
                type="model"
                searchField="id"
                searchableFields={[
                  "id",
                  "adminTitle",
                  "title",
                  "slug",
                  "variant",
                ]}
                baseCount={["2", "5", "10", "25", "50", "100"]}
                className="flex flex-col gap-4"
              >
                <Card
                  id="listToolbar"
                  data-testid="list-toolbar"
                  className={cn(
                    "rounded-lg border border-border bg-card p-4",
                    isModuleView && "hidden",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                      <div className="relative min-w-[300px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="entitySearchInput"
                          data-testid="entity-search-input"
                          type="text"
                          className="w-full border-border bg-card py-2 pl-9 pr-3 text-sm"
                          placeholder="Search entities..."
                          value={state.entitySearch}
                          onChange={(event) => {
                            const value = event.target.value;
                            setState((previous) => {
                              const next = cloneValue(previous);
                              next.entitySearch = value;
                              next.currentPage = 1;
                              return next;
                            });
                          }}
                        />
                      </div>

                      <Select
                        value={state.sortBy}
                        onValueChange={(value) => {
                          setState((previous) => {
                            const next = cloneValue(previous);
                            next.sortBy = value as any;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger
                          id="sortSelect"
                          data-testid="sort-select"
                          className="w-[180px]"
                        >
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Sort: ID</SelectItem>
                          <SelectItem value="title">Sort: Title</SelectItem>
                          <SelectItem value="slug">Sort: Slug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      id="addNewButton"
                      data-testid="add-new-button"
                      type="button"
                      className="!w-auto rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                      onClick={() => {
                        if (isModuleView) {
                          return;
                        }

                        const entity = createEmptyEntityByModel(
                          state.selectedModel,
                        );
                        openEntityPanel(entity, {
                          append: false,
                          modelName: state.selectedModel,
                          moduleId: state.selectedModule,
                          mode: "create",
                        });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new
                    </Button>
                  </div>
                </Card>

                <TableComponent isServer={false} variant="admin-v2-table">
                  <section
                    id="entityList"
                    data-testid="entity-list"
                    className="space-y-3"
                  >
                    {isModuleView ? (
                      <div
                        data-testid={tid(
                          "module-overview",
                          state.selectedModule,
                        )}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {moduleOverviewCards}
                        </div>
                      </div>
                    ) : null}
                    {!isModuleView ? (
                      pagedEntities.length ? (
                        pagedEntities.map((entity) => (
                          <TableRowComponent
                            isServer={false}
                            variant="admin-v2-table-row"
                            key={entity.id}
                            entity={entity}
                            selectedModel={state.selectedModel}
                            selectedModule={state.selectedModule}
                            copyFeedback={copyFeedback}
                            tid={tid}
                            copyToClipboard={copyToClipboard}
                            openPreviewDialog={openPreviewDialog}
                            openEntityEditorById={openEntityEditorById}
                            openConfirmDialog={openConfirmDialog}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-border bg-surface p-20 text-center text-4xl text-muted-foreground/60">
                          No found items.
                        </div>
                      )
                    ) : null}
                  </section>
                </TableComponent>

                <Card
                  id="paginationPanel"
                  data-testid="pagination-panel"
                  className={cn(
                    "rounded-lg border border-border bg-card p-4",
                    isModuleView && "hidden",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={String(state.itemsPerPage)}
                        onValueChange={(value) => {
                          setState((previous) => {
                            const next = cloneValue(previous);
                            next.itemsPerPage = Number(value || 2);
                            next.currentPage = 1;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger
                          id="itemsPerPageSelect"
                          data-testid="items-per-page-select"
                          className="w-[140px]"
                        >
                          <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 per page</SelectItem>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="25">25 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                          <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        Page {Math.min(state.currentPage, totalPages)} of{" "}
                        {totalPages} ({filteredEntities.length} total)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="pagination-prev"
                        disabled={state.currentPage <= 1}
                        className="!w-auto rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          setState((previous) => {
                            const next = cloneValue(previous);
                            next.currentPage = Math.max(
                              1,
                              next.currentPage - 1,
                            );
                            return next;
                          });
                        }}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="pagination-next"
                        disabled={state.currentPage >= totalPages}
                        className="!w-auto rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          setState((previous) => {
                            const next = cloneValue(previous);
                            next.currentPage = Math.min(
                              totalPages,
                              next.currentPage + 1,
                            );
                            return next;
                          });
                        }}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TableControllerComponent>
            </div>
          </main>
        </div>
      </div>

      <div
        data-testid="entity-drawer-backdrop"
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/25 transition",
          state.drawerStack.length
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeTopEntityPanel}
      />

      <div
        data-testid="relation-drawer-backdrop"
        className={cn(
          "fixed inset-0 z-[55] bg-slate-900/25 transition",
          state.relationEditor.open
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeRelationDrawer}
      />

      <div
        data-testid="entity-drawer-root"
        className="pointer-events-none fixed inset-0 z-50"
      >
        {state.drawerStack.map((panel, panelDepth) => {
          const isTop = panelDepth === topDepth;
          const canManageRelations = panel.modelName === "product";
          const relationCount = Object.values(panel.relations).reduce(
            (sum, list) => sum + (list?.length || 0),
            0,
          );
          const stackedOffset = (topDepth - panelDepth) * 40;
          const relationOffset = isTop && state.relationEditor.open ? 40 : 0;
          const scale = Math.max(
            0.84,
            1 -
              (topDepth - panelDepth) * 0.03 -
              (isTop && state.relationEditor.open ? 0.03 : 0),
          );

          const translate = stackedOffset + relationOffset;

          ensureActiveRelationTab(panel);
          const relationTabs = getRelationTabs(panel);
          const activeRelationType = panel.activeRelationTab;
          const relationPageData = getRelationPageData(
            panel,
            activeRelationType,
          );
          const activeRelationItems = relationPageData.items;

          return (
            <FormComponent
              isServer={false}
              key={`${panel.modelName}-${panel.entityId}-${panelDepth}`}
              module={panel.moduleId}
              id={panel.entityId}
              variant={String(panel.formData?.variant || "default")}
              name={panel.modelName}
              type="model"
              panelDepth={panelDepth}
              isTop={isTop}
              style={{
                transform: `translateX(-${translate}px) scale(${scale})`,
                zIndex: 100 + panelDepth,
              }}
            >
              <header className="border-b border-border bg-white px-6 pb-4 pt-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {panel.mode === "create" ? "Create" : "Update"}{" "}
                      {formatLabel(panel.modelName)}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        data-testid={tid(
                          "panel-copy-id",
                          panelDepth,
                          panel.modelName,
                          panel.entityId,
                        )}
                        className={cn(
                          "!w-auto rounded border border-slate-300 bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-slate-100",
                          copyFeedback[panel.entityId] &&
                            "border-emerald-500 bg-emerald-100 text-emerald-700",
                        )}
                        aria-label="Copy id"
                        onClick={() => copyToClipboard(panel.entityId)}
                      >
                        {panel.entityId}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    data-testid={tid(
                      "panel-close",
                      panelDepth,
                      panel.modelName,
                      panel.entityId,
                    )}
                    className="!w-auto rounded p-2 transition hover:bg-muted"
                    aria-label="Close editor"
                    onClick={closeTopEntityPanel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="flex min-h-0 flex-1 flex-col border-b border-border bg-slate-100">
                <Tabs
                  className="flex min-h-0 flex-1 flex-col"
                  value={panel.activeTab}
                  onValueChange={(value) => {
                    setState((previous) => {
                      const next = cloneValue(previous);
                      const target = next.drawerStack[panelDepth];
                      if (!target) {
                        return previous;
                      }
                      target.activeTab = value as EntityTab;
                      return next;
                    });
                  }}
                >
                  <div className="px-6 pb-4 pt-4">
                    <TabsList
                      className={cn(
                        "h-auto justify-start grid w-full rounded-md border border-transparent bg-slate-100 p-0",
                        canManageRelations ? "grid-cols-2" : "grid-cols-1",
                      )}
                    >
                      <TabsTrigger
                        value="details"
                        data-testid={tid(
                          "panel-tab-details",
                          panelDepth,
                          panel.modelName,
                          panel.entityId,
                        )}
                        className="w-full rounded px-3 py-1.5 text-sm data-[state=active]:bg-white"
                      >
                        Details
                      </TabsTrigger>
                      {canManageRelations ? (
                        <TabsTrigger
                          value="relations"
                          data-testid={tid(
                            "panel-tab-relations",
                            panelDepth,
                            panel.modelName,
                            panel.entityId,
                          )}
                          className="w-full rounded px-3 py-1.5 text-sm data-[state=active]:bg-white"
                        >
                          Relations
                          <span className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">
                            {relationCount}
                          </span>
                        </TabsTrigger>
                      ) : null}
                    </TabsList>
                  </div>

                  <div
                    className="scroll-thin h-0 min-h-0 flex-1 overflow-y-scroll bg-slate-100 px-6 pb-28 pt-4"
                    data-panel-depth={panelDepth}
                    data-testid={tid(
                      "panel-content",
                      panelDepth,
                      panel.modelName,
                      panel.entityId,
                    )}
                  >
                    <TabsContent value="details" className="mt-0">
                      <div className="space-y-6">
                        <section className="space-y-2">
                          <label
                            className="block text-sm font-medium"
                            htmlFor={`entity-field-adminTitle-${panel.entityId}`}
                          >
                            Admin Title
                          </label>
                          <Input
                            id={`entity-field-adminTitle-${panel.entityId}`}
                            data-testid={tid(
                              "field",
                              panel.modelName,
                              panel.entityId,
                              "adminTitle",
                            )}
                            value={panel.formData.adminTitle || ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              setState((previous) => {
                                const next = cloneValue(previous);
                                const target = next.drawerStack[panelDepth];
                                if (!target) {
                                  return previous;
                                }
                                target.formData.adminTitle = value;
                                return next;
                              });
                            }}
                          />
                        </section>

                        <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                          <h3 className="font-semibold">
                            {panel.modelName === "attribute"
                              ? "String"
                              : "Title"}
                          </h3>

                          <div className="space-y-2">
                            <label
                              className="block text-sm font-medium"
                              htmlFor={`entity-field-title-${panel.entityId}`}
                            >
                              English
                            </label>
                            <Input
                              id={`entity-field-title-${panel.entityId}`}
                              data-testid={tid(
                                "field",
                                panel.modelName,
                                panel.entityId,
                                "title",
                              )}
                              value={panel.formData.title || ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setState((previous) => {
                                  const next = cloneValue(previous);
                                  const target = next.drawerStack[panelDepth];
                                  if (!target) {
                                    return previous;
                                  }
                                  target.formData.title = value;
                                  return next;
                                });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              className="block text-sm font-medium"
                              htmlFor={`entity-field-titleRu-${panel.entityId}`}
                            >
                              Russian
                            </label>
                            <Input
                              id={`entity-field-titleRu-${panel.entityId}`}
                              data-testid={tid(
                                "field",
                                panel.modelName,
                                panel.entityId,
                                "titleRu",
                              )}
                              value={panel.formData.titleRu || ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setState((previous) => {
                                  const next = cloneValue(previous);
                                  const target = next.drawerStack[panelDepth];
                                  if (!target) {
                                    return previous;
                                  }
                                  target.formData.titleRu = value;
                                  return next;
                                });
                              }}
                            />
                          </div>
                        </section>

                        {panel.modelName === "product" ? (
                          <>
                            <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                              <h3 className="font-semibold">
                                Short Description
                              </h3>

                              <div className="space-y-2">
                                <label
                                  className="block text-sm font-medium"
                                  htmlFor={`entity-field-shortDescription-${panel.entityId}`}
                                >
                                  English
                                </label>
                                <Textarea
                                  id={`entity-field-shortDescription-${panel.entityId}`}
                                  data-testid={tid(
                                    "field",
                                    panel.modelName,
                                    panel.entityId,
                                    "shortDescription",
                                  )}
                                  rows={3}
                                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                  value={panel.formData.shortDescription || ""}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setState((previous) => {
                                      const next = cloneValue(previous);
                                      const target =
                                        next.drawerStack[panelDepth];
                                      if (!target) {
                                        return previous;
                                      }
                                      target.formData.shortDescription = value;
                                      return next;
                                    });
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <label
                                  className="block text-sm font-medium"
                                  htmlFor={`entity-field-shortDescriptionRu-${panel.entityId}`}
                                >
                                  Russian
                                </label>
                                <Textarea
                                  id={`entity-field-shortDescriptionRu-${panel.entityId}`}
                                  data-testid={tid(
                                    "field",
                                    panel.modelName,
                                    panel.entityId,
                                    "shortDescriptionRu",
                                  )}
                                  rows={3}
                                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                  value={
                                    panel.formData.shortDescriptionRu || ""
                                  }
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setState((previous) => {
                                      const next = cloneValue(previous);
                                      const target =
                                        next.drawerStack[panelDepth];
                                      if (!target) {
                                        return previous;
                                      }
                                      target.formData.shortDescriptionRu =
                                        value;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            </section>

                            <section className="space-y-2">
                              <label
                                className="block text-sm font-medium"
                                htmlFor={`entity-field-slug-${panel.entityId}`}
                              >
                                Slug
                              </label>
                              <Input
                                id={`entity-field-slug-${panel.entityId}`}
                                data-testid={tid(
                                  "field",
                                  panel.modelName,
                                  panel.entityId,
                                  "slug",
                                )}
                                value={panel.formData.slug || ""}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setState((previous) => {
                                    const next = cloneValue(previous);
                                    const target = next.drawerStack[panelDepth];
                                    if (!target) {
                                      return previous;
                                    }
                                    target.formData.slug = value;
                                    return next;
                                  });
                                }}
                              />
                            </section>

                            <section className="space-y-2">
                              <label className="block text-sm font-medium">
                                Type
                              </label>
                              <Select
                                value={panel.formData.type || "one_off"}
                                onValueChange={(value) => {
                                  setState((previous) => {
                                    const next = cloneValue(previous);
                                    const target = next.drawerStack[panelDepth];
                                    if (!target) {
                                      return previous;
                                    }
                                    target.formData.type = value;
                                    return next;
                                  });
                                }}
                              >
                                <SelectTrigger
                                  data-testid={tid(
                                    "field",
                                    panel.modelName,
                                    panel.entityId,
                                    "type",
                                  )}
                                >
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="one_off">
                                    one_off
                                  </SelectItem>
                                  <SelectItem value="subscription">
                                    subscription
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </section>
                          </>
                        ) : null}

                        {panel.modelName === "attribute" ? (
                          <>
                            <section className="space-y-2">
                              <label
                                className="block text-sm font-medium"
                                htmlFor={`entity-field-number-${panel.entityId}`}
                              >
                                Number
                              </label>
                              <Input
                                id={`entity-field-number-${panel.entityId}`}
                                data-testid={tid(
                                  "field",
                                  panel.modelName,
                                  panel.entityId,
                                  "number",
                                )}
                                type="number"
                                value={
                                  panel.formData.number === undefined ||
                                  panel.formData.number === null
                                    ? ""
                                    : String(panel.formData.number)
                                }
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  setState((previous) => {
                                    const next = cloneValue(previous);
                                    const target = next.drawerStack[panelDepth];
                                    if (!target) {
                                      return previous;
                                    }
                                    target.formData.number =
                                      raw.length > 0 ? Number(raw) : undefined;
                                    return next;
                                  });
                                }}
                              />
                            </section>

                            <section className="space-y-2">
                              <label className="block text-sm font-medium">
                                Boolean
                              </label>
                              <Select
                                value={
                                  panel.formData.boolean ? "true" : "false"
                                }
                                onValueChange={(value) => {
                                  setState((previous) => {
                                    const next = cloneValue(previous);
                                    const target = next.drawerStack[panelDepth];
                                    if (!target) {
                                      return previous;
                                    }
                                    target.formData.boolean = value === "true";
                                    return next;
                                  });
                                }}
                              >
                                <SelectTrigger
                                  data-testid={tid(
                                    "field",
                                    panel.modelName,
                                    panel.entityId,
                                    "boolean",
                                  )}
                                >
                                  <SelectValue placeholder="Select value" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="false">false</SelectItem>
                                  <SelectItem value="true">true</SelectItem>
                                </SelectContent>
                              </Select>
                            </section>

                            <section className="space-y-2">
                              <label
                                className="block text-sm font-medium"
                                htmlFor={`entity-field-slug-${panel.entityId}`}
                              >
                                Slug
                              </label>
                              <Input
                                id={`entity-field-slug-${panel.entityId}`}
                                data-testid={tid(
                                  "field",
                                  panel.modelName,
                                  panel.entityId,
                                  "slug",
                                )}
                                value={panel.formData.slug || ""}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setState((previous) => {
                                    const next = cloneValue(previous);
                                    const target = next.drawerStack[panelDepth];
                                    if (!target) {
                                      return previous;
                                    }
                                    target.formData.slug = value;
                                    return next;
                                  });
                                }}
                              />
                            </section>
                          </>
                        ) : null}
                      </div>
                    </TabsContent>

                    {canManageRelations ? (
                      <TabsContent value="relations" className="mt-0 space-y-4">
                        <Tabs
                          value={panel.activeRelationTab}
                          onValueChange={(value) => {
                            setState((previous) => {
                              const next = cloneValue(previous);
                              const target = next.drawerStack[panelDepth];
                              if (!target) {
                                return previous;
                              }
                              target.activeRelationTab = value as RelationType;
                              return next;
                            });
                          }}
                        >
                          <TabsList
                            data-testid={tid(
                              "relation-tabs",
                              panelDepth,
                              panel.modelName,
                              panel.entityId,
                            )}
                            className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1"
                          >
                            {relationTabs.map((tab) => (
                              <TabsTrigger
                                key={tab.key}
                                value={tab.key}
                                data-testid={tid(
                                  "relation-tab",
                                  panelDepth,
                                  panel.modelName,
                                  panel.entityId,
                                  tab.key,
                                )}
                                className="rounded px-3 py-1.5 text-sm"
                              >
                                {tab.label}
                                <span className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">
                                  {tab.count}
                                </span>
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          <TabsContent
                            value={activeRelationType}
                            className="mt-4"
                          >
                            <TableControllerComponent
                              isServer={false}
                              headless
                              module={panel.moduleId}
                              name={activeRelationType}
                              variant="find"
                              type="relation"
                              searchField="id"
                              searchableFields={[
                                "id",
                                "orderIndex",
                                "variant",
                                "className",
                                "productId",
                                "attributeId",
                              ]}
                              className="w-full"
                            >
                              <section
                                data-testid={tid(
                                  "relation-section",
                                  panelDepth,
                                  activeRelationType,
                                )}
                                className="rounded-none border-x-0 border-y border-slate-300 bg-slate-100 p-6 shadow-none"
                              >
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    <div className="relative min-w-[240px] flex-1">
                                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                        value={
                                          (panel.relationQuery[
                                            activeRelationType
                                          ]?.search as string) || ""
                                        }
                                        data-testid={tid(
                                          "relation-search",
                                          panelDepth,
                                          activeRelationType,
                                        )}
                                        placeholder="Search..."
                                        className="w-full py-2 pl-9 pr-3 text-sm"
                                        onChange={(event) => {
                                          const value = event.target.value;
                                          setState((previous) => {
                                            const next = cloneValue(previous);
                                            const target =
                                              next.drawerStack[panelDepth];
                                            if (!target) {
                                              return previous;
                                            }
                                            const query = ensureRelationQuery(
                                              target,
                                              activeRelationType,
                                            );
                                            query.search = value;
                                            const filteredCount =
                                              getFilteredRelationList(
                                                target,
                                                activeRelationType,
                                              ).length;
                                            const paging = ensureRelationPaging(
                                              target,
                                              activeRelationType,
                                              filteredCount,
                                            );
                                            paging.currentPage = 1;
                                            return next;
                                          });
                                        }}
                                      />
                                    </div>

                                    <Select
                                      value={
                                        (panel.relationQuery[activeRelationType]
                                          ?.field as string) || "all"
                                      }
                                      onValueChange={(value) => {
                                        setState((previous) => {
                                          const next = cloneValue(previous);
                                          const target =
                                            next.drawerStack[panelDepth];
                                          if (!target) {
                                            return previous;
                                          }
                                          const query = ensureRelationQuery(
                                            target,
                                            activeRelationType,
                                          );
                                          query.field = value;
                                          const filteredCount =
                                            getFilteredRelationList(
                                              target,
                                              activeRelationType,
                                            ).length;
                                          const paging = ensureRelationPaging(
                                            target,
                                            activeRelationType,
                                            filteredCount,
                                          );
                                          paging.currentPage = 1;
                                          return next;
                                        });
                                      }}
                                    >
                                      <SelectTrigger
                                        data-testid={tid(
                                          "relation-filter",
                                          panelDepth,
                                          activeRelationType,
                                        )}
                                        className="w-[170px]"
                                      >
                                        <SelectValue placeholder="Filter by" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getRelationFilterOptions(
                                          activeRelationType,
                                        ).map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button
                                    type="button"
                                    data-testid={tid(
                                      "relation-create",
                                      panelDepth,
                                      activeRelationType,
                                    )}
                                    className="!w-auto rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                                    onClick={() => {
                                      openRelationDrawer({
                                        mode: "create",
                                        panelDepth,
                                        relationType: activeRelationType,
                                      });
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Attach
                                  </Button>
                                </div>

                                <div className="space-y-4">
                                  {activeRelationItems.length ? (
                                    activeRelationItems.map(
                                      (relation, index) => {
                                        const absoluteIndex =
                                          relationPageData.startIndex + index;
                                        const isFirst = absoluteIndex === 0;
                                        const isLast =
                                          absoluteIndex ===
                                          relationPageData.totalItems - 1;

                                        if (
                                          activeRelationType ===
                                          "products-to-attributes"
                                        ) {
                                          const item =
                                            relation as ProductAttributeRelation;

                                          return (
                                            <TableRowComponent
                                              isServer={false}
                                              variant="admin-v2-table-row"
                                              key={item.id}
                                            >
                                              <Card
                                                data-testid={tid(
                                                  "relation-card",
                                                  panelDepth,
                                                  activeRelationType,
                                                  item.id,
                                                )}
                                                className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div className="flex flex-col items-center gap-1 pt-1">
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      disabled={isFirst}
                                                      data-testid={tid(
                                                        "relation-move-up",
                                                        panelDepth,
                                                        activeRelationType,
                                                        item.id,
                                                      )}
                                                      className="!w-auto rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                                      aria-label="Move up"
                                                      onClick={() =>
                                                        moveRelation(
                                                          panelDepth,
                                                          activeRelationType,
                                                          item.id,
                                                          "up",
                                                        )
                                                      }
                                                    >
                                                      <ChevronUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      disabled={isLast}
                                                      data-testid={tid(
                                                        "relation-move-down",
                                                        panelDepth,
                                                        activeRelationType,
                                                        item.id,
                                                      )}
                                                      className="!w-auto rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                                      aria-label="Move down"
                                                      onClick={() =>
                                                        moveRelation(
                                                          panelDepth,
                                                          activeRelationType,
                                                          item.id,
                                                          "down",
                                                        )
                                                      }
                                                    >
                                                      <ChevronDown className="h-3 w-3" />
                                                    </Button>
                                                  </div>

                                                  <div className="min-w-0 flex-1 space-y-3">
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                      <div>
                                                        <span className="text-slate-500">
                                                          Order Index
                                                        </span>
                                                        <p className="mt-0.5 font-mono text-slate-900">
                                                          {item.orderIndex}
                                                        </p>
                                                      </div>
                                                      <div>
                                                        <span className="text-slate-500">
                                                          Variant
                                                        </span>
                                                        <p className="mt-0.5 text-slate-900">
                                                          {item.variant ||
                                                            "default"}
                                                        </p>
                                                      </div>
                                                      <div>
                                                        <span className="text-slate-500">
                                                          Class Name
                                                        </span>
                                                        <p className="mt-0.5 text-slate-900">
                                                          {item.className ||
                                                            "—"}
                                                        </p>
                                                      </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                                      <div className="min-w-0">
                                                        <span className="text-slate-500">
                                                          ID
                                                        </span>
                                                        <div className="mt-0.5">
                                                          <Button
                                                            type="button"
                                                            variant="outline"
                                                            data-testid={tid(
                                                              "relation-copy-id",
                                                              panelDepth,
                                                              activeRelationType,
                                                              item.id,
                                                            )}
                                                            className={cn(
                                                              "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                                                              copyFeedback[
                                                                item.id
                                                              ] &&
                                                                "border-emerald-500 bg-emerald-100 text-emerald-700",
                                                            )}
                                                            title={item.id}
                                                            aria-label="Copy relation id"
                                                            onClick={() =>
                                                              copyToClipboard(
                                                                item.id,
                                                              )
                                                            }
                                                          >
                                                            {item.id}
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      <div className="min-w-0">
                                                        <span className="text-slate-500">
                                                          Product ID
                                                        </span>
                                                        <div className="mt-0.5">
                                                          <Button
                                                            type="button"
                                                            variant="outline"
                                                            data-testid={tid(
                                                              "relation-copy-product-id",
                                                              panelDepth,
                                                              activeRelationType,
                                                              panel.entityId,
                                                            )}
                                                            className={cn(
                                                              "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                                                              copyFeedback[
                                                                panel.entityId
                                                              ] &&
                                                                "border-emerald-500 bg-emerald-100 text-emerald-700",
                                                            )}
                                                            title={
                                                              panel.entityId
                                                            }
                                                            aria-label="Copy product id"
                                                            onClick={() =>
                                                              copyToClipboard(
                                                                panel.entityId,
                                                              )
                                                            }
                                                          >
                                                            {panel.entityId}
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      <div className="min-w-0">
                                                        <span className="text-slate-500">
                                                          Attribute ID
                                                        </span>
                                                        <div className="mt-0.5">
                                                          <Button
                                                            type="button"
                                                            variant="outline"
                                                            data-testid={tid(
                                                              "relation-copy-attribute-id",
                                                              panelDepth,
                                                              activeRelationType,
                                                              item.attribute.id,
                                                            )}
                                                            className={cn(
                                                              "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                                                              copyFeedback[
                                                                item.attribute
                                                                  .id
                                                              ] &&
                                                                "border-emerald-500 bg-emerald-100 text-emerald-700",
                                                            )}
                                                            title={
                                                              item.attribute.id
                                                            }
                                                            aria-label="Copy attribute id"
                                                            onClick={() =>
                                                              copyToClipboard(
                                                                item.attribute
                                                                  .id,
                                                              )
                                                            }
                                                          >
                                                            {item.attribute.id}
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="flex shrink-0 flex-col gap-2">
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      data-testid={tid(
                                                        "relation-edit",
                                                        panelDepth,
                                                        activeRelationType,
                                                        item.id,
                                                      )}
                                                      className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                      aria-label="Edit relation"
                                                      onClick={() => {
                                                        openRelationDrawer({
                                                          mode: "edit",
                                                          panelDepth,
                                                          relationType:
                                                            activeRelationType,
                                                          relationId: item.id,
                                                        });
                                                      }}
                                                    >
                                                      <Pencil className="h-3 w-3" />
                                                    </Button>

                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      data-testid={tid(
                                                        "open-related-entity",
                                                        panelDepth,
                                                        "attribute",
                                                        item.attribute.id,
                                                      )}
                                                      className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                      aria-label="Open related entity"
                                                      onClick={() => {
                                                        openRelatedEntity({
                                                          model: "attribute",
                                                          id: item.attribute.id,
                                                        });
                                                      }}
                                                    >
                                                      <ExternalLink className="h-3 w-3" />
                                                    </Button>

                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      data-testid={tid(
                                                        "relation-delete",
                                                        panelDepth,
                                                        activeRelationType,
                                                        item.id,
                                                      )}
                                                      className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                      aria-label="Delete relation"
                                                      onClick={() => {
                                                        openConfirmDialog({
                                                          actionType:
                                                            "relation-delete",
                                                          title:
                                                            "Delete relation?",
                                                          description:
                                                            "This relation link will be removed from the entity.",
                                                          confirmLabel:
                                                            "Delete relation",
                                                          payload: {
                                                            panelDepth,
                                                            relationType:
                                                              activeRelationType,
                                                            relationId: item.id,
                                                          },
                                                        });
                                                      }}
                                                    >
                                                      <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </Card>
                                            </TableRowComponent>
                                          );
                                        }

                                        const articleRelation =
                                          relation as ProductArticleRelation;

                                        return (
                                          <TableRowComponent
                                            isServer={false}
                                            variant="admin-v2-table-row"
                                            key={articleRelation.id}
                                          >
                                            <Card
                                              data-testid={tid(
                                                "relation-card",
                                                panelDepth,
                                                activeRelationType,
                                                articleRelation.id,
                                              )}
                                              className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center gap-1 pt-1">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isFirst}
                                                    data-testid={tid(
                                                      "relation-move-up",
                                                      panelDepth,
                                                      activeRelationType,
                                                      articleRelation.id,
                                                    )}
                                                    className="!w-auto rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label="Move up"
                                                    onClick={() =>
                                                      moveRelation(
                                                        panelDepth,
                                                        activeRelationType,
                                                        articleRelation.id,
                                                        "up",
                                                      )
                                                    }
                                                  >
                                                    <ChevronUp className="h-3 w-3" />
                                                  </Button>

                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isLast}
                                                    data-testid={tid(
                                                      "relation-move-down",
                                                      panelDepth,
                                                      activeRelationType,
                                                      articleRelation.id,
                                                    )}
                                                    className="!w-auto rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label="Move down"
                                                    onClick={() =>
                                                      moveRelation(
                                                        panelDepth,
                                                        activeRelationType,
                                                        articleRelation.id,
                                                        "down",
                                                      )
                                                    }
                                                  >
                                                    <ChevronDown className="h-3 w-3" />
                                                  </Button>
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-3">
                                                  <div className="text-sm">
                                                    <span className="text-slate-500">
                                                      Slug
                                                    </span>
                                                    <p className="mt-0.5 text-slate-900">
                                                      {
                                                        articleRelation.article
                                                          .slug
                                                      }
                                                    </p>
                                                  </div>

                                                  <div className="text-sm">
                                                    <span className="text-slate-500">
                                                      Order Index
                                                    </span>
                                                    <p className="mt-0.5 font-mono text-slate-900">
                                                      {
                                                        articleRelation.orderIndex
                                                      }
                                                    </p>
                                                  </div>

                                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="min-w-0">
                                                      <span className="text-slate-500">
                                                        ID
                                                      </span>
                                                      <div className="mt-0.5">
                                                        <Button
                                                          type="button"
                                                          variant="outline"
                                                          data-testid={tid(
                                                            "relation-copy-id",
                                                            panelDepth,
                                                            activeRelationType,
                                                            articleRelation.id,
                                                          )}
                                                          className={cn(
                                                            "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                                                            copyFeedback[
                                                              articleRelation.id
                                                            ] &&
                                                              "border-emerald-500 bg-emerald-100 text-emerald-700",
                                                          )}
                                                          title={
                                                            articleRelation.id
                                                          }
                                                          aria-label="Copy relation id"
                                                          onClick={() =>
                                                            copyToClipboard(
                                                              articleRelation.id,
                                                            )
                                                          }
                                                        >
                                                          {articleRelation.id}
                                                        </Button>
                                                      </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                      <span className="text-slate-500">
                                                        Article ID
                                                      </span>
                                                      <div className="mt-0.5">
                                                        <Button
                                                          type="button"
                                                          variant="outline"
                                                          data-testid={tid(
                                                            "relation-copy-article-id",
                                                            panelDepth,
                                                            activeRelationType,
                                                            articleRelation
                                                              .article.id,
                                                          )}
                                                          className={cn(
                                                            "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                                                            copyFeedback[
                                                              articleRelation
                                                                .article.id
                                                            ] &&
                                                              "border-emerald-500 bg-emerald-100 text-emerald-700",
                                                          )}
                                                          title={
                                                            articleRelation
                                                              .article.id
                                                          }
                                                          aria-label="Copy article id"
                                                          onClick={() =>
                                                            copyToClipboard(
                                                              articleRelation
                                                                .article.id,
                                                            )
                                                          }
                                                        >
                                                          {
                                                            articleRelation
                                                              .article.id
                                                          }
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex shrink-0 flex-col gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    data-testid={tid(
                                                      "relation-edit",
                                                      panelDepth,
                                                      activeRelationType,
                                                      articleRelation.id,
                                                    )}
                                                    className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                    aria-label="Edit relation"
                                                    onClick={() => {
                                                      openRelationDrawer({
                                                        mode: "edit",
                                                        panelDepth,
                                                        relationType:
                                                          activeRelationType,
                                                        relationId:
                                                          articleRelation.id,
                                                      });
                                                    }}
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                  </Button>

                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    data-testid={tid(
                                                      "open-related-entity",
                                                      panelDepth,
                                                      "article",
                                                      articleRelation.article
                                                        .id,
                                                    )}
                                                    className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                    aria-label="Open related entity"
                                                    onClick={() => {
                                                      openRelatedEntity({
                                                        model: "article",
                                                        id: articleRelation
                                                          .article.id,
                                                      });
                                                    }}
                                                  >
                                                    <ExternalLink className="h-3 w-3" />
                                                  </Button>

                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    data-testid={tid(
                                                      "relation-delete",
                                                      panelDepth,
                                                      activeRelationType,
                                                      articleRelation.id,
                                                    )}
                                                    className="!w-auto rounded-md border border-border p-2 transition hover:bg-white"
                                                    aria-label="Delete relation"
                                                    onClick={() => {
                                                      openConfirmDialog({
                                                        actionType:
                                                          "relation-delete",
                                                        title:
                                                          "Delete relation?",
                                                        description:
                                                          "This relation link will be removed from the entity.",
                                                        confirmLabel:
                                                          "Delete relation",
                                                        payload: {
                                                          panelDepth,
                                                          relationType:
                                                            activeRelationType,
                                                          relationId:
                                                            articleRelation.id,
                                                        },
                                                      });
                                                    }}
                                                  >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </Card>
                                          </TableRowComponent>
                                        );
                                      },
                                    )
                                  ) : (
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                      No matching relations.
                                    </div>
                                  )}
                                </div>

                                <div
                                  data-testid={tid(
                                    "relation-pagination",
                                    panelDepth,
                                    activeRelationType,
                                  )}
                                  className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <label
                                      className="text-sm text-muted-foreground"
                                      htmlFor={`relation-items-per-page-${panelDepth}-${activeRelationType}`}
                                    >
                                      Per page
                                    </label>

                                    <Select
                                      value={String(
                                        relationPageData.itemsPerPage,
                                      )}
                                      onValueChange={(value) => {
                                        setState((previous) => {
                                          const next = cloneValue(previous);
                                          const target =
                                            next.drawerStack[panelDepth];
                                          if (!target) {
                                            return previous;
                                          }
                                          const filteredCount =
                                            getFilteredRelationList(
                                              target,
                                              activeRelationType,
                                            ).length;
                                          const paging = ensureRelationPaging(
                                            target,
                                            activeRelationType,
                                            filteredCount,
                                          );
                                          paging.itemsPerPage = Math.max(
                                            1,
                                            Number(value || 1),
                                          );
                                          paging.currentPage = 1;
                                          return next;
                                        });
                                      }}
                                    >
                                      <SelectTrigger
                                        id={`relation-items-per-page-${panelDepth}-${activeRelationType}`}
                                        data-testid={tid(
                                          "relation-items-per-page",
                                          panelDepth,
                                          activeRelationType,
                                        )}
                                        className="w-[130px]"
                                      >
                                        <SelectValue placeholder="Per page" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">
                                          1 per page
                                        </SelectItem>
                                        <SelectItem value="5">
                                          5 per page
                                        </SelectItem>
                                        <SelectItem value="10">
                                          10 per page
                                        </SelectItem>
                                        <SelectItem value="25">
                                          25 per page
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <span className="text-sm text-muted-foreground">
                                      Page {relationPageData.currentPage} of{" "}
                                      {relationPageData.totalPages} (
                                      {relationPageData.totalItems} total)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      data-testid={tid(
                                        "relation-page-prev",
                                        panelDepth,
                                        activeRelationType,
                                      )}
                                      disabled={
                                        relationPageData.currentPage <= 1
                                      }
                                      className="!w-auto rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      onClick={() => {
                                        setState((previous) => {
                                          const next = cloneValue(previous);
                                          const target =
                                            next.drawerStack[panelDepth];
                                          if (!target) {
                                            return previous;
                                          }
                                          const filteredCount =
                                            getFilteredRelationList(
                                              target,
                                              activeRelationType,
                                            ).length;
                                          const paging = ensureRelationPaging(
                                            target,
                                            activeRelationType,
                                            filteredCount,
                                          );
                                          paging.currentPage = Math.max(
                                            1,
                                            paging.currentPage - 1,
                                          );
                                          return next;
                                        });
                                      }}
                                    >
                                      <ChevronLeft className="mr-1 h-4 w-4" />
                                      Prev
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      data-testid={tid(
                                        "relation-page-next",
                                        panelDepth,
                                        activeRelationType,
                                      )}
                                      disabled={
                                        relationPageData.currentPage >=
                                        relationPageData.totalPages
                                      }
                                      className="!w-auto rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      onClick={() => {
                                        setState((previous) => {
                                          const next = cloneValue(previous);
                                          const target =
                                            next.drawerStack[panelDepth];
                                          if (!target) {
                                            return previous;
                                          }
                                          const paging = ensureRelationPaging(
                                            target,
                                            activeRelationType,
                                          );
                                          const filteredCount =
                                            getFilteredRelationList(
                                              target,
                                              activeRelationType,
                                            ).length;
                                          const pages = Math.max(
                                            1,
                                            Math.ceil(
                                              filteredCount /
                                                paging.itemsPerPage,
                                            ),
                                          );
                                          paging.currentPage = Math.min(
                                            pages,
                                            paging.currentPage + 1,
                                          );
                                          return next;
                                        });
                                      }}
                                    >
                                      Next
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </section>
                            </TableControllerComponent>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    ) : null}
                  </div>
                </Tabs>
              </div>

              <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-3 border-t border-border bg-white p-6">
                <Button
                  type="button"
                  variant="outline"
                  data-testid={tid(
                    "panel-cancel",
                    panelDepth,
                    panel.modelName,
                    panel.entityId,
                  )}
                  className="!w-auto rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
                  onClick={closeTopEntityPanel}
                >
                  Cancel
                </Button>

                {panel.activeTab === "details" ? (
                  <Button
                    type="button"
                    data-testid={tid(
                      "panel-save",
                      panelDepth,
                      panel.modelName,
                      panel.entityId,
                    )}
                    className="!w-auto inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700"
                    onClick={saveEntity}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                ) : null}
              </footer>
            </FormComponent>
          );
        })}
      </div>

      {state.relationEditor.open && state.relationEditor.formData ? (
        <FormComponent
          variant=""
          isServer={false}
          module={relationOwnerPanel?.moduleId || state.selectedModule}
          name={state.relationEditor.relationType || "relation"}
          id={state.relationEditor.targetRelationId || undefined}
          type="relation"
          panelDepth={topDepth + 1}
          isTop={true}
          className="pointer-events-none fixed inset-0 z-[60]"
          style={{
            transform: "translateX(0) scale(1)",
            zIndex: 200,
          }}
        >
          {(() => {
            const rel = state.relationEditor;
            const panel =
              rel.ownerDepth !== null
                ? state.drawerStack[rel.ownerDepth]
                : null;

            if (!panel || !rel.relationType) {
              return null;
            }

            const formData = rel.formData;
            if (!formData) {
              return null;
            }

            const available = availableRelationEntities;
            const entityType =
              rel.relationType === "products-to-attributes"
                ? "attribute"
                : "article";

            return (
              <>
                <header className="border-b border-border px-6 pb-4 pt-6">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-3xl font-bold tracking-tight">
                        {rel.mode === "create" ? "Create" : "Edit"} Relation
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {rel.mode === "create"
                          ? `Link a new ${entityType} to this entity`
                          : "Update the relation properties"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      data-testid={tid(
                        "relation-drawer-close",
                        rel.ownerDepth,
                        rel.relationType,
                      )}
                      className="!w-auto rounded p-2 transition hover:bg-muted"
                      aria-label="Close relation editor"
                      onClick={closeRelationDrawer}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </header>

                <div className="scroll-thin flex-1 space-y-4 overflow-y-scroll px-6 py-6">
                  {rel.mode === "create" ? (
                    <section className="space-y-2">
                      <label className="block text-sm font-medium">
                        {formatLabel(entityType)}
                      </label>
                      <Select
                        value={formData.selectedEntityId || undefined}
                        onValueChange={(value) => {
                          setState((previous) => {
                            const next = cloneValue(previous);
                            if (!next.relationEditor.formData) {
                              return previous;
                            }
                            next.relationEditor.formData.selectedEntityId =
                              value;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger
                          data-testid={tid(
                            "relation-field",
                            rel.ownerDepth,
                            rel.relationType,
                            "selectedEntityId",
                          )}
                        >
                          <SelectValue
                            placeholder={`Select ${entityType}...`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {available.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {getRelationEntityLabel(
                                rel.relationType as RelationType,
                                item as any,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </section>
                  ) : null}

                  <section className="space-y-2">
                    <label className="block text-sm font-medium">
                      Order Index
                    </label>
                    <Input
                      type="number"
                      data-testid={tid(
                        "relation-field",
                        rel.ownerDepth,
                        rel.relationType,
                        "orderIndex",
                      )}
                      value={formData.orderIndex}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setState((previous) => {
                          const next = cloneValue(previous);
                          if (!next.relationEditor.formData) {
                            return previous;
                          }
                          next.relationEditor.formData.orderIndex = value;
                          return next;
                        });
                      }}
                    />
                  </section>

                  {rel.relationType === "products-to-attributes" ? (
                    <>
                      <section className="space-y-2">
                        <label className="block text-sm font-medium">
                          Variant
                        </label>
                        <Select
                          value={formData.variant || "default"}
                          onValueChange={(value) => {
                            setState((previous) => {
                              const next = cloneValue(previous);
                              if (!next.relationEditor.formData) {
                                return previous;
                              }
                              next.relationEditor.formData.variant = value;
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger
                            data-testid={tid(
                              "relation-field",
                              rel.ownerDepth,
                              rel.relationType,
                              "variant",
                            )}
                          >
                            <SelectValue placeholder="Variant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">default</SelectItem>
                            <SelectItem value="alternative">
                              alternative
                            </SelectItem>
                            <SelectItem value="premium">premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </section>

                      <section className="space-y-2">
                        <label className="block text-sm font-medium">
                          Class Name
                        </label>
                        <Input
                          data-testid={tid(
                            "relation-field",
                            rel.ownerDepth,
                            rel.relationType,
                            "className",
                          )}
                          value={formData.className || ""}
                          placeholder="Optional CSS class"
                          onChange={(event) => {
                            const value = event.target.value;
                            setState((previous) => {
                              const next = cloneValue(previous);
                              if (!next.relationEditor.formData) {
                                return previous;
                              }
                              next.relationEditor.formData.className = value;
                              return next;
                            });
                          }}
                        />
                      </section>
                    </>
                  ) : null}
                </div>

                <footer className="flex items-center justify-end border-t border-border p-6">
                  <Button
                    type="button"
                    data-testid={tid(
                      "relation-drawer-save",
                      rel.ownerDepth,
                      rel.relationType,
                    )}
                    disabled={
                      rel.mode === "create" && !formData.selectedEntityId
                    }
                    className="!w-auto inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={saveRelation}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {rel.mode === "create"
                      ? "Create Relation"
                      : "Update Relation"}
                  </Button>
                </footer>
              </>
            );
          })()}
        </FormComponent>
      ) : null}

      <Dialog
        open={state.previewDialog.open}
        onOpenChange={(open) => (open ? null : closePreviewDialog())}
      >
        <DialogContent
          data-testid="preview-dialog-panel"
          className="w-full max-w-[96vw] overflow-hidden rounded-xl border border-slate-300 bg-white p-0 shadow-[0_12px_42px_rgba(15,23,42,0.24)] sm:max-w-[96vw]"
        >
          {(() => {
            const viewportPresets = {
              "2xl": { label: "2XL", width: 1536 },
              lg: { label: "LG", width: 1024 },
              xs: { label: "XS", width: 375 },
            };

            const activeViewport = viewportPresets[state.previewDialog.viewport]
              ? state.previewDialog.viewport
              : "lg";
            const currentViewport = viewportPresets[activeViewport];
            const entity = getPreviewEntity(state);
            const title = entity?.title || entity?.adminTitle || "Untitled";
            const shortDescription =
              entity?.shortDescription ||
              "This is a placeholder preview for frontend component rendering.";

            return (
              <>
                <DialogHeader className="border-b border-border px-6 py-4">
                  <DialogTitle className="text-xl font-semibold">
                    Frontend Preview
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Placeholder mode. The real component render will be
                    connected later.
                  </DialogDescription>

                  <Tabs
                    value={activeViewport}
                    onValueChange={(value) => {
                      if (["2xl", "lg", "xs"].includes(value)) {
                        setState((previous) => {
                          const next = cloneValue(previous);
                          next.previewDialog.viewport = value as
                            | "2xl"
                            | "lg"
                            | "xs";
                          return next;
                        });
                      }
                    }}
                  >
                    <TabsList className="mt-3 inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
                      <TabsTrigger
                        value="2xl"
                        data-testid={tid("preview-viewport", "2xl")}
                      >
                        2XL
                      </TabsTrigger>
                      <TabsTrigger
                        value="lg"
                        data-testid={tid("preview-viewport", "lg")}
                      >
                        LG
                      </TabsTrigger>
                      <TabsTrigger
                        value="xs"
                        data-testid={tid("preview-viewport", "xs")}
                      >
                        XS
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </DialogHeader>

                <div className="max-w-full p-6">
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Component Placeholder
                    </p>

                    <p className="mb-3 text-xs text-slate-500">
                      Viewport: {currentViewport.label} ({currentViewport.width}
                      px)
                    </p>

                    <div className="w-full max-w-full overflow-x-scroll overscroll-x-contain rounded-lg border border-slate-200 bg-slate-100/70 p-4 pb-3">
                      <div className="inline-block align-top">
                        <div
                          className="min-w-[375px] transition-all duration-300"
                          style={{
                            width: currentViewport.width,
                            minWidth: currentViewport.width,
                          }}
                        >
                          <Card className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                            <h4 className="text-lg font-semibold text-slate-900">
                              {title}
                            </h4>
                            <p className="mt-2 text-sm text-slate-700">
                              {shortDescription}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-slate-500">Slug</span>
                                <p className="mt-0.5 text-slate-900">
                                  {entity?.slug || "—"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Variant</span>
                                <p className="mt-0.5 text-slate-900">
                                  {entity?.variant || "default"}
                                </p>
                              </div>
                            </div>

                            <Button
                              type="button"
                              className="mt-4 !w-auto rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Primary Action
                            </Button>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={state.confirmDialog.open}
        onOpenChange={(open) => (open ? null : closeConfirmDialog())}
      >
        <AlertDialogContent
          data-testid="confirm-dialog-panel"
          className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-[0_12px_42px_rgba(15,23,42,0.24)]"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              {state.confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {state.confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex items-center justify-end gap-3">
            <AlertDialogCancel
              data-testid="confirm-dialog-cancel"
              className="!w-auto rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
              onClick={closeConfirmDialog}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              data-testid="confirm-dialog-delete"
              className={cn(
                "!w-auto inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold",
                ["entity-delete", "relation-delete"].includes(
                  state.confirmDialog.actionType,
                )
                  ? "border border-red-300 bg-red-600 text-white hover:bg-red-700"
                  : "border border-slate-400 bg-slate-900 text-white hover:border-slate-500 hover:bg-slate-800",
              )}
              onClick={confirmAction}
            >
              {state.confirmDialog.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function Component(props: IAdminPanelDraftProps) {
  return (
    <EcommerceProvider>
      <ClientComponentInner {...props} />
    </EcommerceProvider>
  );
}
