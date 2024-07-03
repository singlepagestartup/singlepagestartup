import { IRelation } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/contracts/root";
import { IRelation as IRelationExtended } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/contracts/extended";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  className?: string;
  data?: IRelation;
  setOpen?: (open: boolean) => void;
}

export interface IComponentPropsExtended extends IComponentProps {
  data?: IRelationExtended;
}