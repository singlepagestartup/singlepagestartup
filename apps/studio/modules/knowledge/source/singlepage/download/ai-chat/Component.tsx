"use client";
import type { IComponentProps, ISourceDownloadProps } from "./interface";
export type { ISourceDownloadProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import { Component as WebsiteBuilderModuleButton } from "../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { useSource } from "../../id/ai-chat/Source";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "download-ai-chat",
  label = ".md",
}: IComponentProps) {
  const { source } = useSource();
  function download() {
    const url = URL.createObjectURL(
      new Blob([`# ${source.title}\n\n${source.content}\n`], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${source.title}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <span
      className="inline-flex"
      data-module="knowledge"
      data-model="source"
      data-variant={variant}
    >
      <Button
        data-ds-block="knowledge.source.download-ai-chat"
        variant="secondary"
        aria-label={`Download ${source.title}.md`}
        onClick={download}
      >
        <Icon name="arrow-down" />
        {label}
      </Button>
    </span>
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
