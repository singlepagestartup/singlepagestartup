"use client";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
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
    <section
      aria-label={`${documentName} editor`}
      className="min-w-0 bg-[color:var(--workspace-brand-background)] p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon name="file-text" />
          {documentName}
        </h3>
        <SourceDownload />
      </div>
      <SourceCard {...props} />
    </section>
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
