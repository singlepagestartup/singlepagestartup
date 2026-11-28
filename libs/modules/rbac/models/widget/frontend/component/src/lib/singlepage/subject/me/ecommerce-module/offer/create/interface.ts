import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { ICatalogContext } from "@sps/rbac/models/subject/sdk/model";
export const variant = "subject-me-ecommerce-module-offer-create" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  ecommerceModuleStoreId?: string;
  language?: string;
}
export interface IComponentPropsExtended extends IComponentProps {
  subjectId: string;
}
export interface IEditorProps {
  language?: string;
  subjectId: string;
  storeId: string;
  context: ICatalogContext;
  onRefresh: () => Promise<unknown>;
}
export interface IBoxDraft {
  id: string;
  count: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  weight_kg: string;
}
