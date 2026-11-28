"use client";

import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { Component as MessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";

import { MessageAttachmentList } from "@sps/ui-adapter";
import { getFilePreviewKind } from "@sps/shared-frontend-client-utils";

interface IAttachmentListProps {
  files: IFileStorageModuleFile[];
  language: string;
}

function AttachmentList({ files, language }: IAttachmentListProps) {
  if (!files.length) return null;
  return (
    <MessageAttachmentList
      items={files}
      language={language}
      label={language === "ru" ? "Файлы сообщения" : "Message attachments"}
      itemId={(file) => file.id}
      isPhoto={(file) =>
        getFilePreviewKind({
          name: file.file || file.adminTitle || file.id,
          mimeType: file.mimeType,
          extension: file.extension,
        }) === "image"
      }
    >
      {(file) => (
        <FileStorageModuleFile
          isServer={false}
          variant="attachment-ai-chat"
          layout="message"
          dataSource="props"
          data={file}
          language={language}
        />
      )}
    </MessageAttachmentList>
  );
}

interface IMessageAttachmentsProps {
  files?: IFileStorageModuleFile[];
  language: string;
  messageId: string;
}

export function MessageAttachments(props: IMessageAttachmentsProps) {
  if (props.files) {
    return <AttachmentList files={props.files} language={props.language} />;
  }
  return (
    <MessagesToFileStorageModuleFiles
      variant="find"
      isServer={false}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "messageId", method: "eq", value: props.messageId },
            ],
          },
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      }}
    >
      {({ data: links }) => {
        if (!links?.length) return null;
        const ids = links.map((link) => link.fileStorageModuleFileId);
        return (
          <FileStorageModuleFile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "id", method: "inArray", value: ids }],
                },
              },
            }}
          >
            {({ data: files }) => {
              const byId = new Map(files?.map((file) => [file.id, file]));
              return (
                <AttachmentList
                  files={ids.flatMap((id) => byId.get(id) ?? [])}
                  language={props.language}
                />
              );
            }}
          </FileStorageModuleFile>
        );
      }}
    </MessagesToFileStorageModuleFiles>
  );
}
