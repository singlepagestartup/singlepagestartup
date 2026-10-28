import Glyphs from "../../../../../website-builder/feature/singlepage/icon/icons.json";
function WebsiteBuilderModuleFeature({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  variant?: string;
  name: keyof typeof Glyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = Glyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
import type { IProjectFile } from "../../../../../social/profile/singlepage/scope/ai-chat/project/state";

export interface IAttachmentFileProps {
  variant?: string;
  file: IProjectFile;
}
export function Component({
  variant = "attachment-ai-chat",
  file,
}: IAttachmentFileProps) {
  const image =
    file.mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Открыть ${file.name}`}
      data-module="file-storage"
      data-model="file"
      data-variant={variant}
      data-id={file.id}
      className="block overflow-hidden rounded-xl border border-border bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <div className="flex h-24 items-center justify-center bg-neutral-500">
        {image && file.fileUrl ? (
          <img
            src={file.fileUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <WebsiteBuilderModuleFeature
            variant="icon"
            name="file-text"
            className="size-7 text-background"
          />
        )}
      </div>
      <p title={file.name} className="truncate px-3 py-2 text-xs font-medium">
        {file.name}
      </p>
    </a>
  );
}
