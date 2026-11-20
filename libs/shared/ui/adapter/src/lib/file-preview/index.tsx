"use client";

import { useEffect, useState } from "react";
import Markdown from "markdown-to-jsx";
import {
  FileText,
  FileType2,
  File,
  Download,
  ExternalLink,
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
                        return safe ? (
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
  const [localUrl, setLocalUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const ru = props.language === "ru";
  const row = props.layout === "row";
  const availability = props.availability ?? "preview";
  const kind = getFilePreviewKind({
    name: props.name,
    mimeType: props.mimeType,
    extension: props.extension,
  });
  useEffect(() => {
    if (!props.localFile || kind !== "image" || availability !== "preview") {
      return;
    }
    const url = URL.createObjectURL(props.localFile);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [props.localFile, kind, availability]);
  const src = getFilePreviewUrl(
    props.localFile ? localUrl || "" : props.src || "",
  );
  const extension =
    (props.extension || props.name.match(/\.([^./]+)$/)?.[1])
      ?.replace(/^\./, "")
      .toUpperCase() || (ru ? "Файл" : "File");
  const text = kind === "text" || kind === "markdown" || kind === "html";
  let Glyph = File;
  if (kind === "pdf") {
    Glyph = FileType2;
  } else if (kind === "image" || extension === "SVG" || extension === "SVGZ") {
    Glyph = ImageIcon;
  } else if (text) {
    Glyph = FileText;
  }
  const downloadLabel = ru ? "Скачать" : "Download";
  const openOriginal =
    src && !props.localFile && !src.startsWith("blob:") && kind !== "html";

  async function download() {
    setDownloading(true);
    setDownloadError("");
    try {
      const blob = props.localFile || (await props.onDownload?.());
      if (!blob) return;
      const url = URL.createObjectURL(
        blob.slice(0, blob.size, "application/octet-stream"),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = props.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(
        ru ? "Не удалось скачать файл." : "The file could not be downloaded.",
      );
    } finally {
      setDownloading(false);
    }
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
          props.thumbnailClassName,
        )}
      >
        {availability === "preview" && kind === "image" && src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1">
            <Glyph className={row ? "size-4" : "size-7"} />
            {!row && (
              <span className="text-[10px] font-bold tracking-wider">
                {extension}
              </span>
            )}
          </span>
        )}
      </span>
      <span className={row ? "min-w-0 flex-1" : "block px-3 py-2"}>
        <span
          title={props.name}
          className={cn(
            "block truncate font-medium",
            row ? "text-sm" : "text-xs",
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
      {row && availability === "preview" && (
        <Eye
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
      {row && availability === "download-only" && (
        <Download
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
    </>
  );

  if (availability === "unavailable") {
    return <div className={triggerClassName}>{label}</div>;
  }
  if (availability === "download-only") {
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
        {downloadError && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {downloadError}
          </p>
        )}
      </div>
    );
  }

  function renderPreview() {
    if ((!props.localFile && !src) || failed) {
      return (
        <p role="alert" className="p-6 text-sm text-muted-foreground">
          {props.language === "ru"
            ? "Предпросмотр недоступен. Скачайте оригинал."
            : "Preview is unavailable. Download the original."}
        </p>
      );
    }
    if (kind === "image") {
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
                onError={() => setFailed(true)}
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
      if (props.localFile) {
        return (
          <LocalText
            file={props.localFile}
            kind={kind}
            language={props.language}
          />
        );
      }
      return props.textContent;
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
    <Dialog
      onOpenChange={() => {
        setZoom(1);
        setFailed(false);
        setDownloadError("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${props.language === "ru" ? "Открыть" : "Preview"} ${props.name}`}
          className={triggerClassName}
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        closeLabel={props.language === "ru" ? "Закрыть" : "Close"}
        className="flex h-[min(88dvh,900px)] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-foreground sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <DialogTitle
            className="truncate text-base leading-6"
            title={props.name}
          >
            {props.name}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            {extension} ·{" "}
            {props.language === "ru" ? "Предпросмотр файла" : "File preview"}
          </DialogDescription>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          {renderPreview()}
        </div>
        {downloadError && (
          <p role="alert" className="px-4 py-2 text-xs text-destructive">
            {downloadError}
          </p>
        )}
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-3">
          {(props.localFile || src) && (
            <>
              {openOriginal && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold"
                >
                  <ExternalLink className="size-4" />
                  {props.language === "ru"
                    ? "Открыть оригинал"
                    : "Open original"}
                </a>
              )}
              {(props.localFile || props.onDownload) && (
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
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
