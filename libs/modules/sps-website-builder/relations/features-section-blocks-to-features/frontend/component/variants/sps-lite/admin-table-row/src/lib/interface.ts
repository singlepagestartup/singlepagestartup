import { IRelation } from "@sps/sps-website-builder/relations/features-section-blocks-to-features/contracts/root";
import { IRelation as IRelationExtended } from "@sps/sps-website-builder/relations/features-section-blocks-to-features/contracts/extended";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-table-row" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: Partial<IRelation>;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IRelationExtended;
}