import type { IProjectFile } from "../../../../social/profile/singlepage/scope/ai-chat/project/state";

export const variant = "attachment-ai-chat";

export interface IAttachmentFileProps {
  variant?: "attachment-ai-chat";
  file: IProjectFile;
}

type IVariantInputs = NonNullable<IAttachmentFileProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "attachment-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
