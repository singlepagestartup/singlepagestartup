import { FileText } from "../../../../../workspace/utils/components/ModuleIcons";
import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";

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
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--workspace-brand-background)]">
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
              <span className="block break-all font-medium text-[var(--workspace-brand-foreground)]">
                {attachment.name}
              </span>
              <span className={kit.muted}>{attachment.size}</span>
            </span>
          </>
        );
        const classes = `flex min-w-0 items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-3 text-sm ${kit.focus}`;
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
