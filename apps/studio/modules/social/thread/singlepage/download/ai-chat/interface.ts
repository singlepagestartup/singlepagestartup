import type { IAIChatSource } from "../../../../profile/singlepage/scope/ai-chat/project/models";

export const variant = "download-ai-chat";

export interface IThreadDownloadProps {
  variant?: "download-ai-chat";
  threadId: string;
  fileName: string;
  sources: IAIChatSource[];
}

type IVariantInputs = NonNullable<IThreadDownloadProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "download-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
