"use client";

import { useEffect, useState } from "react";
import Markdown from "markdown-to-jsx";
import {
  FileText,
  FileType2,
  File,
  Download,
  ExternalLink,
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
      {kind === "markdown" && (
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
            ? "Файл слишком большой для предпросмотра текста. Откройте или скачайте оригинал."
            : "This file is too large for text preview. Open or download the original.",
      });
      return;
    }
    reader.onload = () => {
      if (active) setResult({ text: String(reader.result || "") });
    };
    reader.onerror = () => {
      if (active)
        setResult({
          error:
            language === "ru"
              ? "Не удалось прочитать файл. Откройте или скачайте оригинал."
              : "This file could not be read. Open or download the original.",
        });
    };
    reader.readAsText(file);
    return () => {
      active = false;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file, language]);
  if (result.error)
    return (
      <p role="alert" className="p-6 text-sm text-muted-foreground">
        {result.error}
      </p>
    );
  if (result.text === undefined)
    return (
      <p role="status" className="p-6 text-sm text-muted-foreground">
        {language === "ru" ? "Загрузка предпросмотра…" : "Loading preview…"}
      </p>
    );
  return <FilePreviewText text={result.text} kind={kind} language={language} />;
}

export function FilePreview(props: IFilePreviewProps) {
  const [localUrl, setLocalUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    if (!props.localFile) return;
    const url = URL.createObjectURL(props.localFile);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [props.localFile]);
  const src = getFilePreviewUrl(
    props.localFile ? localUrl || "" : props.src || "",
  );
  const kind = getFilePreviewKind({
    name: props.name,
    mimeType: props.mimeType,
    extension: props.extension,
  });
  const extension = (props.extension || props.name.split(".").pop() || "FILE")
    .replace(/^\./, "")
    .toUpperCase();
  const Glyph =
    kind === "pdf"
      ? FileType2
      : kind === "text" || kind === "markdown"
        ? FileText
        : File;
  const text = kind === "text" || kind === "markdown";
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
          className={cn(
            "block w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-left text-foreground transition hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            props.className,
          )}
        >
          <span
            className={cn(
              "flex h-24 items-center justify-center overflow-hidden bg-muted",
              props.thumbnailClassName,
            )}
          >
            {kind === "image" && src ? (
              <img
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="flex flex-col items-center gap-1 text-foreground">
                <Glyph aria-hidden="true" className="size-7" />
                <span className="text-[10px] font-bold tracking-wider">
                  {extension}
                </span>
              </span>
            )}
          </span>
          <span
            title={props.name}
            className="block truncate px-3 py-2 text-xs font-medium"
          >
            {props.name}
          </span>
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
          {!src || failed ? (
            <p role="alert" className="p-6 text-sm text-muted-foreground">
              {props.language === "ru"
                ? "Предпросмотр недоступен. Откройте или скачайте оригинал."
                : "Preview is unavailable. Open or download the original."}
            </p>
          ) : kind === "image" ? (
            <>
              <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border p-2">
                <button
                  type="button"
                  aria-label={
                    props.language === "ru" ? "Уменьшить" : "Zoom out"
                  }
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
                  className={cn(
                    "grid h-full place-items-center",
                    zoom === 1.5
                      ? "w-[150%] h-[150%]"
                      : zoom === 2
                        ? "w-[200%] h-[200%]"
                        : zoom === 2.5
                          ? "w-[250%] h-[250%]"
                          : zoom === 3
                            ? "w-[300%] h-[300%]"
                            : "w-full",
                  )}
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
          ) : kind === "pdf" ? (
            <PdfPreview
              language={props.language}
              name={props.name}
              localFile={props.localFile}
              onDownload={props.onDownload}
            />
          ) : text ? (
            props.localFile ? (
              <LocalText
                file={props.localFile}
                kind={kind}
                language={props.language}
              />
            ) : (
              props.textContent
            )
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              {props.language === "ru"
                ? "Предпросмотр этого формата недоступен. Откройте или скачайте оригинал."
                : "Preview is not available for this format. Open or download the original."}
            </p>
          )}
        </div>
        {downloadError && (
          <p role="alert" className="px-4 py-2 text-xs text-destructive">
            {downloadError}
          </p>
        )}
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-3">
          {src && (
            <>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold"
              >
                <ExternalLink className="size-4" />
                {props.language === "ru" ? "Открыть оригинал" : "Open original"}
              </a>
              {(props.localFile || props.onDownload) && (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true);
                    setDownloadError("");
                    try {
                      const blob =
                        props.localFile || (await props.onDownload!());
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = props.name;
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } catch {
                      setDownloadError(
                        props.language === "ru"
                          ? "Не удалось скачать файл. Повторите попытку или откройте оригинал."
                          : "Download failed. Try again or open the original.",
                      );
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  <Download className="size-4" />
                  {props.language === "ru"
                    ? downloading
                      ? "Скачивание…"
                      : "Скачать"
                    : downloading
                      ? "Downloading…"
                      : "Download"}
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
