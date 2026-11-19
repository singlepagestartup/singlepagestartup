"use client";

import { memo, useCallback, useState } from "react";
import { Download } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IPrivateChatAttachment } from "@sps/social/models/message/sdk/model";

interface IProps {
  subjectId: string;
  threadId: string;
  messageId: string;
  attachments: IPrivateChatAttachment[];
  language: string;
}

export function PrivateMessageAttachments(props: IProps) {
  const [downloadingIds, setDownloadingIds] = useState(new Set<string>());
  const [error, setError] = useState(false);
  const ru = props.language === "ru";

  const download = useCallback(
    async (attachment: IPrivateChatAttachment) => {
      setDownloadingIds((current) => new Set(current).add(attachment.id));
      setError(false);
      try {
        const blob = await api.customerWorkAttachment({
          id: props.subjectId,
          threadId: props.threadId,
          messageId: props.messageId,
          attachmentId: attachment.id,
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        setError(true);
      } finally {
        setDownloadingIds((current) => {
          const next = new Set(current);
          next.delete(attachment.id);
          return next;
        });
      }
    },
    [props.subjectId, props.threadId, props.messageId],
  );

  return (
    <div className="mt-2">
      <ul
        aria-label={ru ? "Вложения" : "Attachments"}
        className="flex flex-wrap gap-2"
      >
        {props.attachments.map((attachment) => (
          <AttachmentRow
            key={attachment.id}
            attachment={attachment}
            disabled={downloadingIds.has(attachment.id)}
            language={props.language}
            onDownload={download}
          />
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {ru
            ? "Не удалось скачать файл."
            : "The file could not be downloaded."}
        </p>
      )}
    </div>
  );
}

interface IAttachmentRowProps {
  attachment: IPrivateChatAttachment;
  disabled: boolean;
  language: string;
  onDownload: (attachment: IPrivateChatAttachment) => Promise<void>;
}

const AttachmentRow = memo(function AttachmentRow(props: IAttachmentRowProps) {
  const ru = props.language === "ru";
  return (
    <li className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => void props.onDownload(props.attachment)}
        disabled={props.disabled}
        aria-label={
          ru
            ? `Скачать ${props.attachment.name}`
            : `Download ${props.attachment.name}`
        }
        title={props.attachment.name}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border border-border px-3 text-sm underline-offset-4 hover:underline disabled:opacity-50"
      >
        <Download className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{props.attachment.name}</span>
      </button>
    </li>
  );
});
