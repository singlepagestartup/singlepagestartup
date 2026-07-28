export { type IModel } from "@sps/social/models/skill/sdk/model";
import { IModel } from "@sps/social/models/skill/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-create-dialog" as const;

export interface IChatSkillCreateValues {
  description: string;
  slug: string;
  title: string;
}

export interface IChatSkillCreateContext {
  orderIndex: number;
  profileId: string;
}

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data?: IModel | null;
  language: string;
  open: boolean;
  orderIndex: number;
  profileId: string;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onCreate: (
    values: IChatSkillCreateValues,
    context: IChatSkillCreateContext,
  ) => Promise<void> | void;
  onUpdate?: (
    skill: IModel,
    values: IChatSkillCreateValues,
  ) => Promise<void> | void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
