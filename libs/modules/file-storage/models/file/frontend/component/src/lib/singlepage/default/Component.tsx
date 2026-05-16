import Image from "next/image";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { FileText } from "lucide-react";

export function Component(props: IComponentPropsExtended) {
  const src = props.data.file.includes("https")
    ? props.data.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${props.data.file}`;
  const mimeType = props.data.mimeType || "";
  const extension =
    props.data.extension ||
    props.data.file.split("?")[0].split(".").pop()?.toLowerCase() ||
    "";
  const hasDimensions = Boolean(props.data.width && props.data.height);
  const isAudioOnlyWebm = mimeType === "video/webm" && !hasDimensions;
  const isImage = Boolean(props.data.file && mimeType.startsWith("image/"));
  const isAudio = Boolean(
    props.data.file &&
      (mimeType.startsWith("audio/") ||
        isAudioOnlyWebm ||
        (!mimeType &&
          [
            "aac",
            "flac",
            "m4a",
            "mp3",
            "oga",
            "ogg",
            "opus",
            "wav",
            "webm",
          ].includes(extension))),
  );
  const isVideo = Boolean(
    props.data.file && mimeType.startsWith("video/") && !isAudio,
  );
  const mediaType = isAudioOnlyWebm ? "audio/webm" : mimeType || undefined;
  const title =
    props.data.adminTitle ||
    props.data.alt ||
    props.data.file.split("/").filter(Boolean).pop() ||
    "file";

  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "relative flex items-center justify-center w-full",
        props.data.containerClassName,
        props.containerClassName,
      )}
    >
      {isImage ? (
        <Image
          src={src}
          alt=""
          fill={props.data.containerClassName?.includes("aspect-")}
          width={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.width || 0
              : undefined
          }
          height={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.height || 0
              : undefined
          }
          className={cn(
            "flex w-full h-full max-w-full max-h-full object-contain",
            props.data.className,
            props.className,
          )}
          sizes="100vw"
        />
      ) : null}

      {isVideo ? (
        <video
          width={!hasDimensions ? undefined : props.data.width || undefined}
          height={!hasDimensions ? undefined : props.data.height || undefined}
          className={cn(
            "w-full max-w-full max-h-80 object-contain",
            props.data.className,
          )}
          controls
        >
          <source src={src} type={mediaType} />
        </video>
      ) : null}

      {isAudio ? (
        <div
          className={cn(
            "w-full rounded-md border border-slate-200 bg-white p-3",
            props.data.className,
            props.className,
          )}
        >
          <div className="mb-2 truncate text-xs font-medium text-slate-600">
            {title}
          </div>
          <audio className="h-10 w-full" controls preload="metadata">
            <source src={src} type={mediaType} />
          </audio>
        </div>
      ) : null}

      {props.data.file && !isImage && !isVideo && !isAudio ? (
        <a
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50",
            props.data.className,
            props.className,
          )}
          href={src}
          rel="noreferrer"
          target="_blank"
        >
          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{title}</span>
        </a>
      ) : null}
    </div>
  );
}
