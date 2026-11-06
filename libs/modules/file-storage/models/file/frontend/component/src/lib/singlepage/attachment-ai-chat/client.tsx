"use client";
import { api as fileApi } from "@sps/file-storage/models/file/sdk/client";
import { useCallback } from "react";
import { getFilePreviewKind } from "@sps/shared-frontend-client-utils";
import {
  Component as ChildComponent,
  TextContent as TextContentView,
} from "./Component";
import type { IClientProps, ITextContentProps } from "./interface";

/** Dialog body only: no duplicate File metadata read or Provider. */
function TextContent(props: ITextContentProps) {
  const content = fileApi.previewText({ file: props.file });
  const retry = useCallback(() => void content.refetch(), [content.refetch]);
  const kind = getFilePreviewKind({
    name: props.file.file,
    mimeType: props.file.mimeType,
    extension: props.file.extension,
  });
  return (
    <TextContentView
      language={props.language}
      text={content.data || ""}
      kind={kind}
      isPending={content.isPending}
      error={content.isError ? content.error.message : undefined}
      onRetry={retry}
    />
  );
}

export default function Client(props: IClientProps) {
  return (
    <ChildComponent
      isServer={false}
      dataSource="props"
      data={props.data}
      variant={props.variant}
      language={props.language}
      textContent={<TextContent file={props.data} language={props.language} />}
    />
  );
}
