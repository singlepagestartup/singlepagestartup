import type { ReactNode } from "react";
import type { FilePreviewKind } from "@sps/shared-frontend-client-utils";

export interface IFilePreviewProps {
  name: string;
  mimeType?: string | null;
  extension?: string | null;
  src?: string;
  localFile?: File;
  /** A client reader for stored text; mounted only while the dialog is open. */
  textContent?: ReactNode;
  onDownload?: (signal?: AbortSignal) => Promise<Blob>;
  className?: string;
  thumbnailClassName?: string;
}

export interface IFilePreviewTextProps {
  text: string;
  kind: FilePreviewKind;
}

export interface ILocalTextProps {
  file: File;
  kind: FilePreviewKind;
}

export interface IMarkdownLinkProps {
  href?: string;
  children?: ReactNode;
}

export interface IMarkdownImageProps {
  alt?: string;
}

export interface IPdfPreviewProps {
  name: string;
  localFile?: File;
  onDownload?: (signal?: AbortSignal) => Promise<Blob>;
}
