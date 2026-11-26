"use client";

import { memo, useCallback } from "react";
import { FilePreview } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IPrivateChatAttachment } from "@sps/social/models/message/sdk/model";
import type { IChatAttachmentDownload } from "../interface";

interface IProps {
  subjectId: string;
  threadId: string;
  messageId: string;
  attachments: IPrivateChatAttachment[];
  document?: boolean;
  language: string;
  layout?: "message" | "rail" | "gallery";
  onDownload?: IChatAttachmentDownload;
}

export function PrivateMessageAttachments(props: IProps) {
  const ru = props.language === "ru";
  return (
    <ul
      aria-label={ru ? "Вложения" : "Attachments"}
      className="grid min-w-0 gap-2"
    >
      {props.attachments.map((attachment) => (
        <PrivateMessageAttachment
          key={`${props.subjectId}:${props.threadId}:${props.messageId}:${attachment.id}`}
          attachment={attachment}
          layout={props.layout}
          document={props.document}
          subjectId={props.subjectId}
          threadId={props.threadId}
          messageId={props.messageId}
          language={props.language}
          onDownload={props.onDownload}
        />
      ))}
    </ul>
  );
}

interface IAttachmentRowProps extends Pick<
  IProps,
  | "subjectId"
  | "threadId"
  | "messageId"
  | "language"
  | "layout"
  | "onDownload"
  | "document"
> {
  attachment: IPrivateChatAttachment;
}

export const PrivateMessageAttachment = memo(function PrivateMessageAttachment(
  props: IAttachmentRowProps,
) {
  const download = useCallback(
    (signal?: AbortSignal, maxBytes?: number) =>
      props.onDownload
        ? props.onDownload(
            props.messageId,
            props.attachment.id,
            signal,
            maxBytes,
          )
        : api.customerWorkAttachment({
            id: props.subjectId,
            threadId: props.threadId,
            messageId: props.messageId,
            attachmentId: props.attachment.id,
            options: { signal },
            maxBytes,
          }),
    [
      props.subjectId,
      props.threadId,
      props.messageId,
      props.attachment.id,
      props.onDownload,
    ],
  );
  const imageDocument =
    props.document && props.attachment.mimeType?.startsWith("image/");
  return (
    <li className="min-w-0 max-w-full">
      <FilePreview
        name={props.attachment.name}
        language={props.language}
        mimeType={props.attachment.mimeType}
        layout={props.layout ?? "message"}
        availability={
          props.document && !imageDocument ? "download-only" : undefined
        }
        showDownload={imageDocument}
        onDownload={download}
      />
    </li>
  );
});
