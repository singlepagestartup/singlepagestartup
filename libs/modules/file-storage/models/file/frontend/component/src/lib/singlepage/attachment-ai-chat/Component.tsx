import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { getFilePreviewKind } from "@sps/shared-frontend-client-utils";
import { FilePreviewText } from "@sps/ui-adapter";
import type {
  IComponentPropsExtended,
  ITextContentViewProps,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  const file = props.data;
  const path = file.file.split(/[?#]/)[0];
  const src = /^https?:\/\//i.test(file.file)
    ? file.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`;
  const title =
    file.adminTitle ||
    file.alt ||
    path.split("/").pop() ||
    (props.language === "ru" ? "Файл" : "File");
  const pathExtension = path.match(/\.([^/.]+)$/)?.[1].toLowerCase();
  const extension =
    file.extension?.replace(/^\./, "").toLowerCase() || pathExtension;
  const mimeType = file.mimeType?.split(";")[0].trim().toLowerCase();
  const svgExtension = [pathExtension, extension].find(
    (value) => value === "svg" || value === "svgz",
  );
  const svg = Boolean(svgExtension || mimeType === "image/svg+xml");
  let availability: "preview" | "download-only" | "unavailable" = "preview";
  if (mimeType === "application/x-knowledge-unavailable") {
    availability = "unavailable";
  } else if (svg) {
    availability = "download-only";
  }
  const canPreview =
    availability === "preview" &&
    getFilePreviewKind({ name: title, mimeType, extension }) !== "unsupported";
  return (
    <ClientComponent
      language={props.language}
      fileId={file.id}
      variant={props.variant}
      name={title}
      src={src}
      mimeType={file.mimeType}
      extension={svg ? svgExtension || "svg" : extension}
      layout={canPreview ? props.layout : "row"}
      availability={availability}
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
