"use client";
import { Component as SharedIcon } from "../../../../../shared/icon";

import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { memo, useLayoutEffect, useRef, useState } from "react";
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

export interface IMarkdownFieldProps {
  id: string;
  label: string;
  section: string;
  value: string;
  placeholder: string;
  onChange: (section: string, value: string) => void;
  helpLabel?: string;
  onHelp?: (button: HTMLButtonElement, section: string) => void;
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
};
export const MarkdownField = memo(function MarkdownField({
  id,
  label,
  section,
  value,
  placeholder,
  onChange,
  helpLabel,
  onHelp,
}: IMarkdownFieldProps) {
  const [mode, setMode] = useState<"editor" | "preview">(
    value.trim() ? "preview" : "editor",
  );
  const textarea = useRef<HTMLTextAreaElement>(null);
  const focusEditor = useRef(false);
  useLayoutEffect(() => {
    if (mode === "editor" && focusEditor.current) {
      textarea.current?.focus();
      focusEditor.current = false;
    }
  }, [mode]);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <label htmlFor={id} className={kit.label}>
            {section}
          </label>
          {onHelp && (
            <button
              type="button"
              aria-label={helpLabel ?? `О помощнике ${section}`}
              aria-haspopup="dialog"
              onClick={(event) => onHelp(event.currentTarget, section)}
              className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground focus:outline-none ${kit.focus}`}
            >
              <Icon name="question" className="size-4" />
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label={`${label} — вид документа`}
          className="flex rounded-lg bg-muted p-1"
        >
          {(["editor", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`${label}: ${option === "editor" ? "Редактор" : "Предпросмотр"}`}
              aria-pressed={mode === option}
              aria-controls={option === "editor" ? id : `${id}-preview`}
              onClick={() => {
                focusEditor.current = option === "editor";
                setMode(option);
                if (mode === "editor" && option === "editor")
                  textarea.current?.focus();
              }}
              className={`min-h-7 rounded-md px-2 text-xs font-semibold ${kit.focus} ${mode === option ? "bg-card text-foreground" : kit.muted}`}
            >
              {option === "editor" ? "Редактор" : "Предпросмотр"}
            </button>
          ))}
        </div>
      </div>
      <textarea
        ref={textarea}
        id={id}
        hidden={mode !== "editor"}
        rows={6}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(section, event.target.value)}
        placeholder={placeholder}
        className={`${kit.field} resize-y font-mono text-sm leading-6`}
      />
      {mode === "preview" && (
        <div
          id={`${id}-preview`}
          role="region"
          aria-label={`${label} — предпросмотр`}
          className="min-h-32 min-w-0 rounded-xl border border-border px-3 py-2"
        >
          {value.trim() ? (
            <MarkdownDocument
              disableRawHTML
              externalLinksNewTab
              className="text-sm leading-6 [&_h1]:mb-3 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:text-lg [&_h3]:mt-4 [&_p]:my-2 [&_pre]:rounded-lg [&_pre]:p-3"
            >
              {value}
            </MarkdownDocument>
          ) : (
            <p className={`text-sm leading-6 ${kit.muted}`}>{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
});
