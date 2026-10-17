import type { IProjectTopic } from "../../../../profile/singlepage/scope/ai-chat/project/state";

export const variant = "id-ai-chat-settings";

export interface IThreadSettingsProps {
  variant?: "id-ai-chat-settings";
  topic: IProjectTopic;
  onSave: (title: string) => void;
  onDelete: () => void;
}

type IVariantInputs = NonNullable<IThreadSettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}
