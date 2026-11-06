import type { ReactNode } from "react";

export interface ILocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  localFile?: File;
}

export interface IFileRowProps {
  file: ILocalFile;
  onRemove?: (id: string) => void;
}

export type FileDropPosition = "before" | "after";

export interface IFileDropTarget {
  id: string;
  position: FileDropPosition;
}

export interface IFileCardProps extends IFileRowProps {
  dragging?: boolean;
  dragActive?: boolean;
  dropPosition?: FileDropPosition;
  onDragStart?: (id: string) => void;
  onDragTarget?: (id: string, position: FileDropPosition) => void;
  onDragEnd?: () => void;
  onDrop?: (id: string, targetId: string, position: FileDropPosition) => void;
}

export interface IDraftAttachmentsProps {
  files: ILocalFile[];
  onRemove: (id: string) => void;
  onReorder: (id: string, targetId: string, position: FileDropPosition) => void;
}

export interface IFileDropZoneProps {
  children: ReactNode;
  onFiles: (files: File[]) => void;
}

export interface IFilePreviewProps {
  file: ILocalFile;
  layout?: "row" | "card";
}

export type FilePreviewKind =
  | "image"
  | "pdf"
  | "markdown"
  | "text"
  | "unsupported";

export interface IFilePreviewContentProps {
  file: File;
  kind: FilePreviewKind;
}

export interface IPdfPreviewProps {
  file: File;
}
