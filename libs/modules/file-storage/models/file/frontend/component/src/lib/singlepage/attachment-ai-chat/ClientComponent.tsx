"use client";
import { FilePreview } from "@sps/ui-adapter";
import { useCallback } from "react";
import { api as fileApi } from "@sps/file-storage/models/file/sdk/client";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const download = useCallback(
    (signal?: AbortSignal) =>
      fileApi.download({ src: props.src || "", signal }),
    [props.src],
  );
  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-variant={props.variant}
      data-id={props.fileId}
      className="min-w-0"
    >
      <FilePreview
        language={props.language}
        name={props.name}
        src={props.src}
        mimeType={props.mimeType}
        extension={props.extension}
        textContent={props.textContent}
        onDownload={download}
      />
    </div>
  );
}
