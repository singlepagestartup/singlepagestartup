"use client";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../../../../../../../design/singlepage/interface-kit/ai-chat/icons.json";
import {
  Component as SourceCard,
  type ISourceCardProps,
} from "../../ai-chat/index";
import { Component as SourceDownload } from "../../../download/ai-chat/index";
import { useSource } from "./Source";
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Нет иконки Phosphor:" + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface ISourceDocumentProps extends ISourceCardProps {}
export function Component(props: ISourceDocumentProps) {
  const { source } = useSource();
  const documentName = `${source.title}.md`;
  return (
    <div className="min-w-0 bg-[color:var(--workspace-brand-background)] p-4">
      <section
        aria-label={`${documentName} editor`}
        className="min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)]"
      >
        <header className="flex items-center justify-between gap-2 border-b border-[color:var(--workspace-brand-line)] px-3 py-2">
          <h3 className="inline-flex min-w-0 items-center gap-2 break-words text-sm font-semibold">
            <Icon name="file-text" />
            <span className="min-w-0">{documentName}</span>
          </h3>
          <SourceDownload />
        </header>
        <div className="grid gap-4 p-3">
          <SourceCard {...props} />
        </div>
      </section>
    </div>
  );
}
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
