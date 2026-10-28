import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Markdown from "markdown-to-jsx";
import { Button, Icon, kit } from "../primitives";
import { PdfPreview } from "./PdfPreview";
import { filePreviewKind, formatFileSize } from "./utils";
import type { IFilePreviewProps, IFilePreviewContentProps } from "./interface";

function PreviewContent({ file, kind }: IFilePreviewContentProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState<string>();
  const [error, setError] = useState("");
  const [source, setSource] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  useEffect(() => {
    if (kind !== "text" && kind !== "markdown") return;
    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Text preview is limited to 2 MB. Download the file to read it.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.onerror = () =>
      setError("Could not read this file. Download the original to open it.");
    reader.readAsText(file);
    return () => {
      reader.onload = null;
      reader.onerror = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file, kind]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--workspace-brand-background)]">
        {error ? (
          <p role="alert" className="p-5 text-sm">
            {error}
          </p>
        ) : kind === "image" ? (
          <>
            <div className="flex shrink-0 items-center justify-end gap-2 border-b border-[var(--workspace-brand-line)] p-2">
              <Button
                variant="plain"
                className="px-3"
                aria-label="Zoom out"
                disabled={zoom <= 1}
                onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
              >
                <Icon name="minus" />
              </Button>
              <span className="min-w-12 text-center text-xs tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="plain"
                className="px-3"
                aria-label="Zoom in"
                disabled={zoom >= 3}
                onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
              >
                <Icon name="plus" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <div
                className={`grid place-items-center ${zoom === 1.5 ? "h-[150%] w-[150%]" : zoom === 2 ? "h-[200%] w-[200%]" : zoom === 2.5 ? "h-[250%] w-[250%]" : zoom === 3 ? "h-[300%] w-[300%]" : "h-full w-full"}`}
              >
                {url && (
                  <img
                    src={url}
                    alt={file.name}
                    className="h-full w-full object-contain"
                    onError={() =>
                      setError(
                        "Could not display this image. Download the original to open it.",
                      )
                    }
                  />
                )}
              </div>
            </div>
          </>
        ) : kind === "pdf" ? (
          <PdfPreview file={file} />
        ) : kind === "text" || kind === "markdown" ? (
          <>
            {kind === "markdown" && (
              <div className="flex shrink-0 gap-2 border-b border-[var(--workspace-brand-line)] p-2">
                <Button
                  variant={source ? "plain" : "secondary"}
                  aria-pressed={!source}
                  onClick={() => setSource(false)}
                >
                  Preview
                </Button>
                <Button
                  variant={source ? "secondary" : "plain"}
                  aria-pressed={source}
                  onClick={() => setSource(true)}
                >
                  Source
                </Button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto p-5">
              {text === undefined ? (
                <p role="status" className="text-sm">
                  Loading preview…
                </p>
              ) : !text ? (
                <p className="text-sm">This file is empty.</p>
              ) : kind === "markdown" && !source ? (
                <div className="break-words text-sm leading-6 [&_a]:underline [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-xl [&_h3]:my-2 [&_h3]:font-semibold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--workspace-brand-surface)] [&_pre]:p-3 [&_table]:block [&_table]:overflow-auto [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2">
                  <Markdown
                    options={{
                      disableParsingRawHTML: true,
                      overrides: {
                        a: {
                          component: ({
                            href = "",
                            children,
                          }: {
                            href?: string;
                            children?: React.ReactNode;
                          }) =>
                            /^https?:\/\//i.test(href) ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ) : (
                              <span>{children}</span>
                            ),
                        },
                        img: {
                          component: ({ alt }: { alt?: string }) => (
                            <span>[Image{alt ? `: ${alt}` : ""}]</span>
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
            </div>
          </>
        ) : (
          <p className="p-5 text-sm">
            Preview is not available for this format. Download the file to open
            it.
          </p>
        )}
      </div>
      <div className="flex shrink-0 justify-end border-t border-[var(--workspace-brand-line)] p-3">
        {url && (
          <a href={url} download={file.name} className={kit.secondary}>
            <Icon name="arrow-down" />
            Download original
          </a>
        )}
      </div>
    </>
  );
}

export function FilePreview({ file, layout = "row" }: IFilePreviewProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [projection, setProjection] = useState("singlepage");
  const [thumbnail, setThumbnail] = useState("");
  const kind = filePreviewKind(file);
  useEffect(() => {
    if (kind !== "image" || !file.localFile) return;
    const url = URL.createObjectURL(file.localFile);
    setThumbnail(url);
    return () => URL.revokeObjectURL(url);
  }, [kind, file.localFile]);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (value)
          setProjection(
            trigger.current
              ?.closest("[data-workspace-projection]")
              ?.getAttribute("data-workspace-projection") ?? "singlepage",
          );
        setOpen(value);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          ref={trigger}
          type="button"
          disabled={!file.localFile}
          aria-label={`Preview ${file.name}`}
          className={`${layout === "card" ? "block w-full min-w-0 overflow-hidden rounded-xl text-left transition enabled:hover:bg-[var(--workspace-brand-background)]" : "flex min-h-0 min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left enabled:hover:bg-[var(--workspace-brand-background)] @[24rem]/file-row:min-h-16 @[24rem]/file-row:gap-3"} enabled:cursor-pointer ${kit.focus}`}
        >
          <span
            className={
              layout === "card"
                ? "flex h-20 items-center justify-center overflow-hidden rounded-lg bg-[var(--workspace-brand-background)]"
                : "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--workspace-brand-background)] @[24rem]/file-row:size-9"
            }
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                draggable={false}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Icon
                  name="file-text"
                  className={layout === "card" ? "size-7" : undefined}
                />
                {layout === "card" && (
                  <span className="text-[10px] font-bold tracking-wider">
                    {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                )}
              </span>
            )}
          </span>
          <span
            className={layout === "card" ? "block min-w-0" : "min-w-0 flex-1"}
          >
            <span
              title={file.name}
              className={
                layout === "card"
                  ? "block truncate px-3 py-2 text-xs font-medium"
                  : "block truncate text-sm font-medium @[24rem]/file-row:line-clamp-2 @[24rem]/file-row:whitespace-normal @[24rem]/file-row:break-all"
              }
            >
              {file.name}
            </span>
            {layout === "row" && (
              <span
                title={`${formatFileSize(file.size)} · ${file.type || "File type not supplied"} · local only`}
                className={`block truncate text-xs @[24rem]/file-row:mt-1 ${kit.muted}`}
              >
                {formatFileSize(file.size)} ·{" "}
                {file.type || "File type not supplied"} · local only
              </span>
            )}
          </span>
          {file.localFile && layout === "row" && (
            <Icon name="eye" className={`size-4 ${kit.muted}`} />
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          data-workspace-projection={projection}
          className="fixed left-1/2 top-1/2 z-[60] flex h-[min(88dvh,900px)] w-[calc(100%_-_2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl focus:outline-none"
        >
          <div className="flex shrink-0 items-start gap-3 border-b border-[var(--workspace-brand-line)] p-4">
            <div className="min-w-0 flex-1">
              <Dialog.Title
                className="truncate text-base font-semibold"
                title={file.name}
              >
                {file.name}
              </Dialog.Title>
              <Dialog.Description className={`mt-1 text-xs ${kit.muted}`}>
                {formatFileSize(file.size)} · File preview · local only
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="plain"
                className="px-3"
                aria-label="Close file preview"
              >
                <Icon name="x" />
              </Button>
            </Dialog.Close>
          </div>
          {open && file.localFile && (
            <PreviewContent key={file.id} file={file.localFile} kind={kind} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
