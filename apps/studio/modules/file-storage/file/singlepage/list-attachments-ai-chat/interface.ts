export const variant = "list-attachments-ai-chat";

export interface ISectionAssetsProps {
  variant?: "list-attachments-ai-chat";
  section: string;
  fileIds: string[];
  onAttach: (ids: string[]) => void;
  onRemove: (fileId: string) => void | Promise<void>;
  initialExpanded?: boolean;
  pendingFileId?: string | null;
  errorMessage?: string;
  statusMessage?: string;
}

type IVariantInputs = NonNullable<ISectionAssetsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-attachments-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
