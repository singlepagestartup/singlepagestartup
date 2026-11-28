"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "markdown-to-jsx";
import {
  FileText,
  FileType2,
  File,
  Download,
  Film,
  Headphones,
  Maximize,
  Minimize,
  Play,
  Eye,
  ImageIcon,
  Minus,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@sps/shared-ui-shadcn";
import {
  cn,
  getFilePreviewKind,
  getFilePreviewUrl,
} from "@sps/shared-frontend-client-utils";
import { FILE_PREVIEW_TEXT_MAX_BYTES } from "@sps/shared-utils";
import { HtmlPreview } from "./html";
import { PdfPreview } from "./pdf";
import { usePreviewBlob } from "./use-preview-blob";
import type {
  IFilePreviewProps,
  IFilePreviewTextProps,
  ILocalTextProps,
  IMarkdownLinkProps,
  IMarkdownImageProps,
} from "./interface";

export function FilePreviewText({
  text,
  kind,
  language,
}: IFilePreviewTextProps) {
  const [source, setSource] = useState(false);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {(kind === "markdown" || kind === "html") && (
        <div className="flex shrink-0 gap-1 border-b border-border p-2 text-xs font-semibold">
          <button
            type="button"
            aria-pressed={!source}
            onClick={() => setSource(false)}
            className={cn("min-h-9 rounded-lg px-3", !source && "bg-muted")}
          >
            {language === "ru" ? "Предпросмотр" : "Preview"}
          </button>
          <button
            type="button"
            aria-pressed={source}
            onClick={() => setSource(true)}
            className={cn("min-h-9 rounded-lg px-3", source && "bg-muted")}
          >
            {language === "ru" ? "Исходный текст" : "Source"}
          </button>
        </div>
      )}
      {kind === "html" && !source ? (
        <HtmlPreview text={text} language={language} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {kind === "markdown" && !source ? (
            <div className="prose prose-sm max-w-none break-words text-foreground prose-headings:text-foreground prose-a:text-foreground prose-pre:overflow-auto prose-img:max-w-full">
              <Markdown
                options={{
                  disableParsingRawHTML: true,
                  overrides: {
                    a: {
                      component: ({
                        href = "",
                        children,
                      }: IMarkdownLinkProps) => {
                        const safe = getFilePreviewUrl(href);
                        return safe && !safe.startsWith("blob:") ? (
                          <a
                            href={safe}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ) : (
                          <span>{children}</span>
                        );
                      },
                    },
                    img: {
                      component: ({ alt }: IMarkdownImageProps) => (
                        <span className="text-muted-foreground">
                          [{language === "ru" ? "Изображение" : "Image"}
                          {alt ? `: ${alt}` : ""}]
                        </span>
                      ),
                    },
                  },
                }}
              >
                {text}
              </Markdown>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6">
              {text}
            </pre>
          )}
          {!text && (
            <p className="text-sm text-muted-foreground">
              {language === "ru" ? "Файл пуст." : "This file is empty."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LocalText({ file, kind, language }: ILocalTextProps) {
  const [result, setResult] = useState<{ text?: string; error?: string }>({});
  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    if (file.size > FILE_PREVIEW_TEXT_MAX_BYTES) {
      setResult({
        error:
          language === "ru"
            ? "Файл слишком большой для предпросмотра текста. Скачайте оригинал."
            : "This file is too large for text preview. Download the original.",
      });
      return;
    }
    reader.onload = () => {
      if (active) {
        setResult({ text: String(reader.result || "") });
      }
    };
    reader.onerror = () => {
      if (active) {
        setResult({
          error:
            language === "ru"
              ? "Не удалось прочитать файл. Скачайте оригинал."
              : "This file could not be read. Download the original.",
        });
      }
    };
    reader.readAsText(file);
    return () => {
      active = false;
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file, language]);
  if (result.error) {
    return (
      <p role="alert" className="p-6 text-sm text-muted-foreground">
        {result.error}
      </p>
    );
  }
  if (result.text === undefined) {
    return (
      <p role="status" className="p-6 text-sm text-muted-foreground">
        {language === "ru" ? "Загрузка предпросмотра…" : "Loading preview…"}
      </p>
    );
  }
  return <FilePreviewText text={result.text} kind={kind} language={language} />;
}

export function FilePreview(props: IFilePreviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const downloadController = useRef<AbortController | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playInline, setPlayInline] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [failedSrc, setFailedSrc] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const ru = props.language === "ru";
  const gallery = props.layout === "gallery";
  const rail = props.layout === "rail";
  const message = props.layout === "message";
  const chat = message || rail;
  const declaredKind = getFilePreviewKind(props);
  const kind =
    props.localFile &&
    getFilePreviewKind({
      name: props.localFile.name,
      extension: props.extension,
      mimeType: props.localFile.type || props.mimeType,
    }) !== declaredKind
      ? "unsupported"
      : declaredKind;
  const player = kind === "audio" || kind === "video";
  const media = player || kind === "image";
  const text = kind === "text" || kind === "markdown" || kind === "html";
  const publicSrc = getFilePreviewUrl(props.src || "");
  // Chat media uses the owning SDK when available so the bytes go through
  // the same container check for mounted public and private attachments.
  const directSrc =
    (media && (chat || gallery) && props.onDownload) || props.localFile
      ? undefined
      : publicSrc;
  const previewable =
    kind !== "unsupported" && (props.availability ?? "preview") === "preview";
  const messagePhoto = message && kind === "image" && previewable;

  useEffect(() => {
    if (
      messagePhoto ||
      !previewable ||
      kind !== "image" ||
      directSrc ||
      !container.current
    )
      return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [messagePhoto, previewable, kind, directSrc]);

  const needsBlob =
    (media &&
      !directSrc &&
      (open ||
        playInline ||
        messagePhoto ||
        (kind === "image" && nearViewport))) ||
    (text && open && !props.textContent && !props.localFile);
  const resource = usePreviewBlob(props, kind, previewable && needsBlob);
  const src = directSrc || resource?.url;
  const canDownload = Boolean(props.onDownload || props.localFile);
  const availability =
    props.availability === "unavailable"
      ? "unavailable"
      : !previewable || resource?.status === "unsupported"
        ? canDownload
          ? "download-only"
          : "unavailable"
        : "preview";
  const row =
    props.layout === "row" ||
    rail ||
    (message && (!messagePhoto || availability !== "preview"));
  const extension =
    (props.extension || props.name.match(/\.([^./]+)$/)?.[1])
      ?.replace(/^\./, "")
      .toUpperCase() || (ru ? "Файл" : "File");
  const Glyph =
    kind === "image" || extension === "SVG" || extension === "SVGZ"
      ? ImageIcon
      : kind === "video"
        ? Film
        : kind === "audio"
          ? Headphones
          : kind === "pdf"
            ? FileType2
            : text
              ? FileText
              : File;
  const downloadLabel = ru ? "Скачать" : "Download";
  const openLabel = `${ru ? "Открыть" : "Preview"} ${props.name}`;
  const playLabel = `${ru ? "Воспроизвести" : "Play"} ${props.name}`;

  useEffect(() => {
    setDownloading(false);
    setDownloadError("");
    setPlayInline(false);
    setFailedSrc(undefined);
    return () => downloadController.current?.abort();
  }, [props.onDownload, props.localFile, props.src, props.name]);

  useEffect(() => {
    if (!open) return;
    const change = () =>
      setExpanded(document.fullscreenElement === dialog.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, [open]);

  function toggleExpanded() {
    if (document.fullscreenElement === dialog.current && dialog.current) {
      void document.exitFullscreen().catch(() => {});
    } else if (expanded) {
      setExpanded(false);
    } else {
      // Browsers without element fullscreen can still fill the viewport.
      setExpanded(true);
      void dialog.current?.requestFullscreen?.().catch(() => {});
    }
  }

  async function download() {
    downloadController.current?.abort();
    const controller = new AbortController();
    downloadController.current = controller;
    setDownloading(true);
    setDownloadError("");
    try {
      const blob =
        props.localFile ||
        resource?.blob ||
        (await props.onDownload?.(controller.signal));
      if (!blob || controller.signal.aborted) return;
      const url = URL.createObjectURL(
        blob.slice(0, blob.size, "application/octet-stream"),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = props.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (!controller.signal.aborted)
        setDownloadError(
          ru ? "Не удалось скачать файл." : "The file could not be downloaded.",
        );
    } finally {
      if (!controller.signal.aborted) setDownloading(false);
    }
  }

  const busy = ru ? "Загрузка предпросмотра…" : "Loading preview…";
  const cannotPreview = ru
    ? "Предпросмотр недоступен. Скачайте оригинал."
    : "Preview is unavailable. Download the original.";
  const previewFailed =
    (Boolean(src) && failedSrc === src) ||
    resource?.status === "error" ||
    resource?.status === "unsupported";
  function renderPlayer(inline: boolean) {
    if (!src || previewFailed) {
      return (
        <p
          role={previewFailed ? "alert" : "status"}
          className="p-4 text-sm text-muted-foreground"
        >
          {previewFailed ? cannotPreview : busy}
        </p>
      );
    }
    const attributes = {
      src,
      controls: true,
      autoPlay: inline,
      preload: "metadata",
      "aria-label": props.name,
      onError: () => setFailedSrc(src),
    };
    return kind === "video" ? (
      <video
        {...attributes}
        playsInline
        className={
          inline
            ? "max-h-80 w-full rounded-t-xl bg-black object-contain"
            : "h-full w-full bg-black object-contain"
        }
      />
    ) : (
      <div className="grid h-full place-items-center p-2">
        <audio {...attributes} className="w-full min-w-0 max-w-lg" />
      </div>
    );
  }

  const triggerClassName = cn(
    "w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-left text-foreground",
    row ? "flex min-h-12 items-center gap-2.5 px-2.5 py-1.5" : "block",
    availability !== "unavailable" &&
      "transition hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60",
    props.className,
  );
  const label = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center overflow-hidden bg-muted",
          row ? "size-8 shrink-0 rounded-md" : "h-24",
          gallery && "aspect-square h-auto w-full",
          rail &&
            kind === "image" &&
            availability === "preview" &&
            "size-[4.5rem]",
          messagePhoto && availability === "preview" && "min-h-14 h-auto",
          props.thumbnailClassName,
        )}
      >
        {availability === "preview" &&
        kind === "image" &&
        src &&
        failedSrc !== src ? (
          <img
            src={src}
            alt=""
            loading={messagePhoto ? "eager" : "lazy"}
            draggable={false}
            onError={() => setFailedSrc(src)}
            className={
              message
                ? "block h-auto max-h-[min(55dvh,26rem)] w-full object-contain"
                : "h-full w-full object-contain"
            }
          />
        ) : messagePhoto && availability === "preview" ? (
          <span className="grid aspect-[4/3] w-full place-items-center bg-muted text-xs text-muted-foreground">
            {previewFailed ? cannotPreview : busy}
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            {rail && player && availability === "preview" ? (
              <Play className={rail ? "size-4" : "size-7"} />
            ) : (
              <Glyph className={row ? "size-4" : "size-7"} />
            )}
            {!row && (
              <span className="text-[10px] font-bold tracking-wider">
                {extension}
              </span>
            )}
          </span>
        )}
      </span>
      <span
        className={
          messagePhoto && availability === "preview"
            ? "sr-only"
            : row
              ? "min-w-0 flex-1"
              : "block px-3 py-2"
        }
      >
        <span
          title={props.name}
          className={cn(
            "block truncate font-medium",
            row ? "text-sm" : "text-xs",
            gallery && "whitespace-normal wrap-anywhere line-clamp-2",
          )}
        >
          {props.name}
        </span>
        {(row || availability === "unavailable") && (
          <span className="block truncate text-xs text-muted-foreground">
            {availability === "unavailable"
              ? ru
                ? "Файл недоступен"
                : "File unavailable"
              : extension}
          </span>
        )}
      </span>
      {row &&
        (availability === "preview" ||
          (message && availability === "download-only")) &&
        !(rail && player) && (
          <Eye
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      {row && !message && availability === "download-only" && (
        <Download
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
    </>
  );
  const errorLabel = downloadError && (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {downloadError}
    </p>
  );
  if (availability === "unavailable")
    return <div className={triggerClassName}>{label}</div>;
  if (!message && availability === "download-only" && !open) {
    return (
      <div className="min-w-0">
        <button
          type="button"
          aria-label={`${downloadLabel} ${props.name}`}
          className={triggerClassName}
          disabled={downloading}
          aria-busy={downloading}
          onClick={download}
        >
          {label}
        </button>
        {errorLabel}
      </div>
    );
  }

  function renderPreview() {
    if (
      availability === "download-only" ||
      previewFailed ||
      (kind === "pdf" && !canDownload) ||
      (!src && !canDownload && !props.textContent)
    ) {
      return (
        <p role="alert" className="p-6 text-sm text-muted-foreground">
          {cannotPreview}
        </p>
      );
    }
    if (player) return renderPlayer(false);
    if (kind === "image") {
      if (!src)
        return (
          <p role="status" className="p-6 text-sm text-muted-foreground">
            {busy}
          </p>
        );
      return (
        <>
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border p-2">
            <button
              type="button"
              aria-label={props.language === "ru" ? "Уменьшить" : "Zoom out"}
              disabled={zoom <= 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
              className="grid size-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label={props.language === "ru" ? "Увеличить" : "Zoom in"}
              disabled={zoom >= 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
              className="grid size-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div
              className={cn("grid h-full place-items-center", {
                "w-full": zoom === 1,
                "w-[150%] h-[150%]": zoom === 1.5,
                "w-[200%] h-[200%]": zoom === 2,
                "w-[250%] h-[250%]": zoom === 2.5,
                "w-[300%] h-[300%]": zoom === 3,
              })}
            >
              <img
                src={src}
                alt={props.name}
                onError={() => setFailedSrc(src)}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </>
      );
    }
    if (kind === "pdf") {
      return (
        <PdfPreview
          language={props.language}
          name={props.name}
          localFile={props.localFile}
          onDownload={props.onDownload}
        />
      );
    }
    if (text) {
      if (props.textContent) return props.textContent;
      if (resource?.status === "too-large")
        return (
          <p role="alert" className="p-6 text-sm text-muted-foreground">
            {ru
              ? "Файл слишком большой для предпросмотра текста. Скачайте оригинал."
              : "This file is too large for text preview. Download the original."}
          </p>
        );
      const file = props.localFile || resource?.blob;
      if (file) {
        return <LocalText file={file} kind={kind} language={props.language} />;
      }
      return (
        <p role="status" className="p-6 text-sm text-muted-foreground">
          {busy}
        </p>
      );
    }
    return (
      <p className="p-6 text-sm text-muted-foreground">
        {props.language === "ru"
          ? "Предпросмотр этого формата недоступен. Скачайте оригинал."
          : "Preview is not available for this format. Download the original."}
      </p>
    );
  }

  return (
    <div
      ref={container}
      className={cn("min-w-0 max-w-full", message && "w-full")}
    >
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setPlayInline(false);
          setExpanded(false);
          setZoom(1);
          setFailedSrc(undefined);
          setDownloadError("");
        }}
      >
        {rail && player ? (
          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-card",
              rail && !playInline && "flex items-center",
            )}
          >
            {playInline && !open ? (
              renderPlayer(true)
            ) : (
              <button
                type="button"
                aria-label={playLabel}
                onClick={() => setPlayInline(true)}
                className={cn(triggerClassName, "rounded-none border-0")}
              >
                {label}
              </button>
            )}
            <DialogTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex min-h-10 items-center justify-center gap-2 px-3 text-xs font-medium",
                  rail && !playInline
                    ? "mr-1 size-10 shrink-0 rounded-lg hover:bg-muted"
                    : "w-full border-t border-border",
                )}
                title={openLabel}
                aria-label={openLabel}
              >
                <Maximize className="size-4" />{" "}
                {(!rail || playInline) && (ru ? "Открыть" : "Open")}
              </button>
            </DialogTrigger>
          </div>
        ) : (
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={openLabel}
              className={triggerClassName}
            >
              {label}
            </button>
          </DialogTrigger>
        )}
        <DialogContent
          ref={dialog}
          overlayClassName="z-[70]"
          closeLabel={ru ? "Закрыть" : "Close"}
          className={cn(
            "flex h-[min(90dvh,900px)] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-xl border-border bg-card p-0 text-foreground fullscreen:inset-0 fullscreen:m-0 fullscreen:translate-x-0 fullscreen:translate-y-0 sm:rounded-2xl",
            "z-[70]",
            expanded &&
              "left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:rounded-none",
          )}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-3 pr-12">
            <div className="min-w-0 flex-1">
              <DialogTitle
                className="truncate text-base leading-6"
                title={props.name}
              >
                {props.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {extension} · {ru ? "Предпросмотр файла" : "File preview"}
              </DialogDescription>
            </div>
            <button
              type="button"
              aria-label={
                expanded
                  ? ru
                    ? "Свернуть"
                    : "Exit full screen"
                  : ru
                    ? "На весь экран"
                    : "Full screen"
              }
              aria-pressed={expanded}
              className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-muted"
              onClick={toggleExpanded}
            >
              {expanded ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
            {renderPreview()}
          </div>
          {errorLabel}
          {canDownload && (
            <div className="flex shrink-0 justify-end border-t border-border p-3">
              <button
                type="button"
                disabled={downloading}
                onClick={download}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
              >
                <Download className="size-4" />
                {downloading
                  ? ru
                    ? "Скачивание…"
                    : "Downloading…"
                  : downloadLabel}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {!message && props.showDownload && canDownload && !open && (
        <>
          <button
            type="button"
            aria-label={`${downloadLabel} ${props.name}`}
            disabled={downloading}
            aria-busy={downloading}
            onClick={download}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm text-foreground hover:bg-muted"
          >
            <Download aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{props.name}</span>
          </button>
          {errorLabel}
        </>
      )}
    </div>
  );
}
