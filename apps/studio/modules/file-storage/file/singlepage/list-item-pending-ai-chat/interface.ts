import type { IProjectFile } from "../../../../social/profile/singlepage/scope/ai-chat/project/state";

export const variant = "list-item-pending-ai-chat";

export interface IPendingFileProps {
  variant?: "list-item-pending-ai-chat";
  file: IProjectFile;
  onRemove: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  onReorder?: (id: string, targetId: string) => void;
  first?: boolean;
  last?: boolean;
  disabled?: boolean;
}

type IVariantInputs = NonNullable<IPendingFileProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-pending-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
