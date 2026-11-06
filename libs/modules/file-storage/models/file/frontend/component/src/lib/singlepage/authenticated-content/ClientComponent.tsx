"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import { Skeleton } from "./Skeleton";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const [source, setSource] = useState<{ blob: Blob; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!props.content) {
      setSource(null);
      return;
    }
    const url = URL.createObjectURL(props.content);
    setSource({ blob: props.content, url });
    return () => URL.revokeObjectURL(url);
  }, [props.content]);
  // A changed/denied result cannot render the previous Blob before effect cleanup.
  const src = source?.blob === props.content ? source?.url : undefined;
  const file = props.data;
  const mimeType = file.mimeType || props.content?.type || "";
  const extension = (
    file.extension ||
    file.file.split("?")[0].split(".").pop() ||
    ""
  ).toLowerCase();
  const hasDimensions = Boolean(file.width && file.height);
  const audioWebm = mimeType === "video/webm" && !hasDimensions;
  const isImage = mimeType.startsWith("image/");
  const isAudio =
    mimeType.startsWith("audio/") ||
    audioWebm ||
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
      ].includes(extension));
  const isVideo = mimeType.startsWith("video/") && !isAudio;
  const title =
    file.adminTitle || file.alt || file.file.split("/").pop() || "File";
  const mediaType = audioWebm ? "audio/webm" : mimeType || undefined;
  const russian = props.language === "ru";

  if (props.loading || (props.content && !src)) return <Skeleton />;
  if (!src) {
    return (
      <div
        role="alert"
        className="space-y-2 rounded-lg border border-border p-4 text-sm text-muted-foreground"
      >
        <p>{russian ? "Медиа недоступно" : "Media unavailable"}</p>
        <button
          type="button"
          onClick={props.onRetry}
          className="min-h-10 rounded-lg border border-border px-3 font-medium"
        >
          {russian ? "Повторить" : "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-id={file.id}
      data-variant={props.variant}
      className={cn(
        "relative flex w-full items-center justify-center",
        file.containerClassName,
        props.containerClassName,
      )}
    >
      {isImage ? (
        // Object URLs must bypass the public Next image optimizer.
        <img
          src={src}
          alt={file.alt || ""}
          width={file.width || undefined}
          height={file.height || undefined}
          className={cn(
            "flex h-full max-h-full w-full max-w-full object-contain",
            file.className,
            props.className,
          )}
        />
      ) : null}
      {isVideo ? (
        <video
          key={src}
          width={hasDimensions ? file.width || undefined : undefined}
          height={hasDimensions ? file.height || undefined : undefined}
          controls
          className={cn(
            "max-h-80 w-full max-w-full object-contain",
            file.className,
            props.className,
          )}
        >
          <source src={src} type={mediaType} />
        </video>
      ) : null}
      {isAudio ? (
        <div
          className={cn(
            "w-full rounded-md border border-border bg-card p-3",
            file.className,
            props.className,
          )}
        >
          <div className="mb-2 truncate text-xs font-medium text-muted-foreground">
            {title}
          </div>
          <audio key={src} controls preload="metadata" className="h-10 w-full">
            <source src={src} type={mediaType} />
          </audio>
        </div>
      ) : null}
      {!isImage && !isVideo && !isAudio ? (
        <a
          href={src}
          download={title}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition hover:bg-muted",
            file.className,
            props.className,
          )}
        >
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </a>
      ) : null}
    </div>
  );
}
