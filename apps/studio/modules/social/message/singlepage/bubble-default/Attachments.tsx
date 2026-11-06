import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export interface SocialMessageAttachment {
  id?: string;
  name: string;
  size: string;
  type?: string;
  url?: string;
}
export function SocialMessageAttachments({
  attachments,
  onPreview,
}: {
  attachments: SocialMessageAttachment[];
  onPreview?: (attachment: SocialMessageAttachment) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      {attachments.map((attachment) => {
        const image = Boolean(
          attachment.url && attachment.type?.startsWith("image/"),
        );
        const content = (
          <>
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              {image ? (
                <img
                  src={attachment.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block break-all font-medium text-foreground">
                {attachment.name}
              </span>
              <span className={kit.muted}>{attachment.size}</span>
            </span>
          </>
        );
        const classes = `flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm ${kit.focus}`;
        return image && onPreview ? (
          <button
            type="button"
            key={attachment.id ?? attachment.name}
            className={classes}
            aria-label={`Preview ${attachment.name}`}
            onClick={() => onPreview(attachment)}
          >
            {content}
          </button>
        ) : attachment.url ? (
          <a
            key={attachment.id ?? attachment.name}
            className={classes}
            href={attachment.url}
            download={attachment.name}
            aria-label={`Download ${attachment.name}`}
          >
            {content}
          </a>
        ) : (
          <div key={attachment.id ?? attachment.name} className={classes}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  muted: "text-muted-foreground",
  focus: focus,
};
const FileText = createIcon("file-text");
