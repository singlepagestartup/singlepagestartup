import type { ReactNode } from "react";
import type { IModel as IFeature } from "@sps/website-builder/models/feature/sdk/model";
import type { IModel as IWidgetFeature } from "@sps/website-builder/relations/widgets-to-features/sdk/model";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";

export const variant = "landing-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IChatPreviewProps {
  className?: string;
  language?: string;
  projectTitle: string;
  reply: string;
  documents: IDemoDocument[];
  settings?: ReactNode;
  handoff?: ReactNode;
}
export interface IDemoAttachment {
  id: string;
  name: string;
  text?: string;
  file?: File;
  record?: IFileStorageModuleFile;
}
export interface IDemoMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  files?: IDemoAttachment[];
}
export interface IDemoTopic {
  id: string;
  title: string;
  messages: IDemoMessage[];
}
export interface IDemoMessageProps {
  message: IDemoMessage;
  language: string;
}
export interface IDemoFileProps {
  attachment: IDemoAttachment;
  language: string;
}

export interface IDemoNavigationProps {
  language: string;
  projectTitle: string;
  documents: Pick<IDemoDocumentState, "key" | "title">[];
  selectedDocumentKey: string;
  topics: IDemoTopic[];
  topicId: string | null;
  creating: boolean;
  onSelectDocument: (key: string) => void;
  onSelectTopic: (id: string) => void;
  onCreateTopic: () => void;
  settings?: ReactNode;
}

export interface IDemoDocumentState {
  key: string;
  title: string;
  text: string;
  savedText: string;
  sectionTitle: string;
  savedSectionTitle: string;
  saveStatus: string;
  editing: boolean;
  messages: IDemoMessage[];
  knowledgeFiles: IDemoAttachment[];
}

export interface IDemoDocument {
  key: string;
  title: string;
  text: string;
  section: string;
  intro: string;
  files: IDemoAttachment[];
}
export interface ISectionsProps {
  links: IWidgetFeature[];
  features: IFeature[];
  isServer: boolean;
  language: string;
}
export interface IDemoContentProps
  extends Pick<ISectionsProps, "features" | "isServer" | "language"> {}

export type IDemoFiles = IFileStorageModuleFile[];
