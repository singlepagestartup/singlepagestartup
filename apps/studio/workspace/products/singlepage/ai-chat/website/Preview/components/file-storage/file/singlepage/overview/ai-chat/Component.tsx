"use client";
import IconGlyphs from "../../../../../website-builder/feature/singlepage/icon/icons.json";
import type { IProjectFile } from "../../../../../social/profile/singlepage/scope/ai-chat/project/state";
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
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
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
export interface IFilePreviewProps {
  file: IProjectFile;
  compact?: boolean;
}
export function Component({ file, compact }: IFilePreviewProps) {
  return (
    <figure
      data-module="file-storage"
      data-model="file"
      data-id={file.id}
      data-ds-block="file-storage.file.overview-ai-chat"
      data-variant="overview-ai-chat"
      className="min-w-0 overflow-hidden rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)]"
    >
      {file.mimeType?.startsWith("image/") && file.fileUrl ? (
        <a
          href={file.fileUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Открыть ${file.name}`}
          className={`block ${kit.focus}`}
        >
          <img
            src={file.fileUrl}
            alt={file.name}
            loading="lazy"
            className={`w-full object-contain bg-[color:var(--workspace-brand-background)] ${compact ? "h-24" : "max-h-64"}`}
          />
        </a>
      ) : null}
      <figcaption
        className={`min-w-0 gap-2 p-3 text-xs ${compact ? "grid grid-cols-[1rem_minmax(0,1fr)]" : "flex items-center"}`}
      >
        <Icon
          name={file.mimeType?.startsWith("image/") ? "image" : "file-text"}
          className="size-4 shrink-0"
        />
        <span className="min-w-0 flex-1 break-words">{file.name}</span>
        {file.fileUrl && (
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Открыть ${file.name}`}
            className={`${kit.plain} min-h-9 shrink-0 px-2 ${compact ? "col-span-2 justify-self-end" : ""}`}
          >
            Open
          </a>
        )}
        {file.fileUrl && (
          <a
            href={file.fileUrl}
            download={file.name}
            aria-label={`Скачать ${file.name}`}
            className={`${kit.plain} min-h-9 shrink-0 px-2 ${compact ? "col-span-2 justify-self-end" : ""}`}
          >
            <Icon name="arrow-down" className="size-4" />
            {compact && "Download"}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};
