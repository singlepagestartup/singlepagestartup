"use client";
import type { IComponentProps, ISourceCardProps } from "./interface";
export type { ISourceCardProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as FileStorageModuleFile } from "../../../../../file-storage/file/index";
import { memo, useCallback, useId } from "react";
import { MarkdownField } from "./MarkdownField";
import { sourceUserContext, sourceMaterials } from "./utils";
import { useSource } from "./Source";
function MarkdownDocument({
  children,
  hideTitle = false,
  baseUrl,
  resolveLink,
  externalLinksNewTab = false,
  disableRawHTML = false,
  className,
}: {
  children: string;
  hideTitle?: boolean;
  baseUrl?: string;
  resolveLink?: (url: string) =>
    | string
    | {
        href: string;
        target: "_top";
      };
  externalLinksNewTab?: boolean;
  disableRawHTML?: boolean;
  className?: string;
}) {
  const assetUrl = (value: string = "") => {
    if (!baseUrl || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, `https://studio.invalid${baseUrl}`);
    return url.pathname + url.search + url.hash;
  };
  return (
    <div
      className={twMerge(
        "min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <Markdown
        options={{
          disableParsingRawHTML: disableRawHTML,
          ...(baseUrl || externalLinksNewTab
            ? {
                overrides: {
                  img: {
                    component: ({
                      src,
                      alt,
                      ...props
                    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                      <img {...props} src={assetUrl(src)} alt={alt ?? ""} />
                    ),
                  },
                  a: {
                    component: ({
                      href,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const resolved =
                        resolveLink?.(assetUrl(href)) ?? assetUrl(href);
                      return (
                        <a
                          {...props}
                          {...(typeof resolved === "string"
                            ? { href: resolved }
                            : resolved)}
                          {...(externalLinksNewTab &&
                          /^https?:\/\//i.test(href ?? "")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        />
                      );
                    },
                  },
                },
              }
            : {}),
        }}
      >
        {hideTitle ? children.replace(/^# [^\n]+\n/, "") : children}
      </Markdown>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  focus: focus,
};
export const Component = memo(function Component({
  variant = "id-ai-chat",
  discussing = false,
  onDiscuss,
}: IComponentProps) {
  const { source: data, fileIds, edit: onEdit, attach, detach } = useSource();
  const id = useId();
  const edit = useCallback(
    (_: string, value: string) => onEdit(value),
    [onEdit],
  );
  const materials = sourceMaterials(data.content);
  return (
    <article
      data-id={data.id}
      data-ds-block="knowledge.source.id-ai-chat"
      aria-label={data.title}
      className="rounded-xl border border-border bg-card p-3"
      data-module="knowledge"
      data-model="source"
      data-variant={variant}
    >
      <MarkdownField
        id={id}
        label={data.title}
        section={data.title}
        value={sourceUserContext(data.content)}
        placeholder={data.description ?? "Add your context and notes."}
        onChange={edit}
      />
      {materials && (
        <details className="mt-3 rounded-lg border border-border p-3 text-xs">
          <summary className={`min-h-9 cursor-pointer ${kit.focus}`}>
            Analyzed materials
          </summary>
          <MarkdownDocument
            disableRawHTML
            externalLinksNewTab
            className="text-sm leading-6"
          >
            {materials}
          </MarkdownDocument>
        </details>
      )}
      {onDiscuss && (
        <button
          type="button"
          onClick={onDiscuss}
          className={`${kit.plain} mt-1 min-h-9 px-0 text-xs`}
        >
          <Icon name="chat-circle" className="size-4" />
          {discussing ? "Discussing in chat" : "Discuss this section"}
        </button>
      )}
      <FileStorageModuleFile
        variant="list-attachments-ai-chat"
        section={data.title}
        fileIds={fileIds}
        onAttach={attach}
        onRemove={detach}
      />
    </article>
  );
});
