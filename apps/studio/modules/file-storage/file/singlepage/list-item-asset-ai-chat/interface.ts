import type { IProjectAsset } from "../../../../social/profile/singlepage/scope/ai-chat/project/state";

export const variant = "list-item-asset-ai-chat";

export interface IAssetPreviewProps {
  variant?: "list-item-asset-ai-chat";
  asset: IProjectAsset;
}

type IVariantInputs = NonNullable<IAssetPreviewProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-asset-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
