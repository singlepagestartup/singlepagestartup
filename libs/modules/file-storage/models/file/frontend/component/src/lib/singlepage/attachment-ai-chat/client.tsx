"use client";
import { api as fileApi } from "@sps/file-storage/models/file/sdk/client";
import { FilePreviewText } from "@sps/ui-adapter";
import { getFilePreviewKind } from "@sps/shared-frontend-client-utils";
import type { ITextContentProps } from "./interface";

/** Dialog body only: no duplicate File metadata read or Provider. */
export default function Client(props: ITextContentProps) {
  const content = fileApi.previewText({ file: props.file });
  if (content.isPending)
    return (
      <p role="status" className="p-6 text-sm text-muted-foreground">
        Loading preview…
      </p>
    );
  if (content.isError)
    return (
      <div className="space-y-3 p-6">
        <p role="alert" className="text-sm text-muted-foreground">
          {content.error.message}
        </p>
        <button
          type="button"
          onClick={() => void content.refetch()}
          className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    );
  const kind = getFilePreviewKind({
    name: props.file.file,
    mimeType: props.file.mimeType,
    extension: props.file.extension,
  });
  return <FilePreviewText text={content.data || ""} kind={kind} />;
}
