"use client";

import { memo, useCallback } from "react";
import { FilePreview } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IPrivateChatAttachment } from "@sps/social/models/message/sdk/model";

interface IProps {
  subjectId: string;
  threadId: string;
  messageId: string;
  attachments: IPrivateChatAttachment[];
  language: string;
  fullWidth?: boolean;
}

export function PrivateMessageAttachments(props: IProps) {
  const ru = props.language === "ru";
  return (
    <ul
      aria-label={ru ? "Вложения" : "Attachments"}
      className={
        props.fullWidth ? "grid min-w-0 gap-2" : "mt-2 flex flex-wrap gap-2"
      }
    >
      {props.attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.id}
          attachment={attachment}
          subjectId={props.subjectId}
          threadId={props.threadId}
          messageId={props.messageId}
          language={props.language}
        />
      ))}
    </ul>
  );
}

interface IAttachmentRowProps extends Pick<
  IProps,
  "subjectId" | "threadId" | "messageId" | "language"
> {
  attachment: IPrivateChatAttachment;
}

const AttachmentRow = memo(function AttachmentRow(props: IAttachmentRowProps) {
  const download = useCallback(
    () =>
      api.customerWorkAttachment({
        id: props.subjectId,
        threadId: props.threadId,
        messageId: props.messageId,
        attachmentId: props.attachment.id,
      }),
    [props.subjectId, props.threadId, props.messageId, props.attachment.id],
  );
  return (
    <li className="min-w-0 max-w-full">
      <FilePreview
        name={props.attachment.name}
        language={props.language}
        layout="row"
        availability="download-only"
        onDownload={download}
      />
    </li>
  );
});
