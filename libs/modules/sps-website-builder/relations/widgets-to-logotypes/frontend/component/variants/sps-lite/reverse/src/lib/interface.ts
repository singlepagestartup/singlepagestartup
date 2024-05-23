import { IRelation } from "@sps/sps-website-builder-relations-widgets-to-logotypes-contracts";
import { IRelation as IRelationExtended } from "@sps/sps-website-builder-relations-widgets-to-logotypes-contracts-extended";

export const variant = "reverse" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: Partial<IRelation>;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IRelationExtended;
}
