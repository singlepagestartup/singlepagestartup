import { FileText } from "lucide-react";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { FilePreviewText } from "@sps/ui-adapter";
import type {
  IComponentPropsExtended,
  ITextContentViewProps,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  const file = props.data;
  const src = /^https?:\/\//i.test(file.file)
    ? file.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`;
  const title =
    file.adminTitle || file.alt || file.file.split("/").pop() || "File";
  const extension = (
    file.extension ||
    file.file.split("?")[0].split(".").pop() ||
    ""
  ).toLowerCase();
  const blocked =
    /\.svgz?(?:[?#]|$)/i.test(file.file) ||
    ["svg", "svgz"].includes(extension) ||
    file.mimeType?.split(";")[0].trim().toLowerCase() === "image/svg+xml" ||
    file.mimeType === "application/x-knowledge-unavailable";
  if (blocked)
    return (
      <div
        data-module="file-storage"
        data-model="file"
        data-variant={props.variant}
        data-id={file.id}
        className="overflow-hidden rounded-xl border border-border bg-card p-3"
      >
        <FileText className="size-7" />
        <p className="truncate text-xs font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">Unsupported attachment</p>
      </div>
    );
  return (
    <ClientComponent
      language={props.language}
      fileId={file.id}
      variant={props.variant}
      name={title}
      src={src}
      mimeType={file.mimeType}
      extension={extension}
      textContent={props.textContent}
    />
  );
}

export function TextContent(props: ITextContentViewProps) {
  if (props.isPending)
    return (
      <p role="status" className="p-6 text-sm text-muted-foreground">
        {props.language === "ru"
          ? "Загрузка предпросмотра…"
          : "Loading preview…"}
      </p>
    );
  if (props.error)
    return (
      <div className="space-y-3 p-6">
        <p role="alert" className="text-sm text-muted-foreground">
          {props.error}
        </p>
        <button
          type="button"
          onClick={props.onRetry}
          className="min-h-10 rounded-lg border border-border px-3 text-sm font-semibold"
        >
          {props.language === "ru" ? "Повторить" : "Try again"}
        </button>
      </div>
    );
  return (
    <FilePreviewText
      language={props.language}
      text={props.text}
      kind={props.kind}
    />
  );
}
