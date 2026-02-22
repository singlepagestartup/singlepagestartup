import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  url: string;
  language: string;
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ViewMode = "module" | "model";
export type EntityTab = "details" | "relations";
export type RelationType = "products-to-attributes" | "products-to-articles";
export type RelationTab = RelationType;
export type CopyFeedbackMap = Record<string, boolean>;

export type ModuleItem = {
  id: string;
  name: string;
  icon: string;
};

export type GenericEntity = {
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

export type ProductAttributeRelation = {
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

export type ProductArticleRelation = {
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

export type RelationMap = {
  "products-to-attributes": ProductAttributeRelation[];
  "products-to-articles": ProductArticleRelation[];
};

export type RelationPaging = {
  currentPage: number;
  itemsPerPage: number;
};

export type RelationQuery = {
  search: string;
  field: string;
};

export type DrawerPanel = {
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

export type RelationEditorState = {
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

export type PreviewDialogState = {
  open: boolean;
  modelName: string;
  entityId: string;
  viewport: "2xl" | "lg" | "xs";
};

export type ConfirmDialogState = {
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

export type AdminState = {
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

export type IAdminPanelDraftProps = {
  className?: string;
  url: string;
  language: string;
};
