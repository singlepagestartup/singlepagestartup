import type { IProjectFile } from "../../../../../social/profile/singlepage/scope/ai-chat/project/state";

export const variant = "id-ai-chat";

export interface IFilePreviewProps {
  variant?: "id-ai-chat";
  file: IProjectFile;
  compact?: boolean;
}

type IVariantInputs = NonNullable<IFilePreviewProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
