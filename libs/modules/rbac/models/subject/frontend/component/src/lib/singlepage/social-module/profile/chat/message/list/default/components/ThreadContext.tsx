"use client";

import { memo, useMemo, type Ref } from "react";
import { FileText, Files } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import {
  getAIChatDocument,
  type IAIChatDocument,
} from "@sps/rbac/models/subject/sdk/model";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { readKnowledgeDocumentContent } from "@sps/shared-utils";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { useThreadMessages } from "../hooks/use-thread-messages";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";
import { ThreadCustomerWork } from "./ThreadCustomerWork";

interface IProps {
  subjectId: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  socialModuleThread: ISocialModuleThread;
  isCustomerWork: boolean;
  language: string;
  resultSectionRef: Ref<HTMLElement>;
  selectedVersionId?: string;
  onVersionSelect: (id: string) => void;
}

export const ThreadContext = memo(function ThreadContext(props: IProps) {
  const ru = props.language === "ru";
  const document = getAIChatDocument(props.socialModuleThread.metadata);
  return (
    <div className="grid min-w-0 gap-6">
      {props.isCustomerWork && (
        <ThreadCustomerWork
          subjectId={props.subjectId}
          threadId={props.socialModuleThreadId}
          language={props.language}
          resultSectionRef={props.resultSectionRef}
          selectedVersionId={props.selectedVersionId}
          onVersionSelect={props.onVersionSelect}
        />
      )}
      {!props.isCustomerWork && document?.sourceIds.length ? (
        <ThreadDocumentKnowledge
          document={document}
          subjectId={props.subjectId}
          socialModuleProfileId={props.socialModuleProfileId}
          socialModuleChatId={props.socialModuleChatId}
          language={props.language}
        />
      ) : null}
      <section className="grid min-w-0 gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Files className="size-4 shrink-0" aria-hidden="true" />
          {ru ? "Файлы" : "Files"}
        </h4>
        <ThreadFiles
          isCustomerWork={props.isCustomerWork}
          subjectId={props.subjectId}
          socialModuleProfileId={props.socialModuleProfileId}
          socialModuleChatId={props.socialModuleChatId}
          socialModuleThreadId={props.socialModuleThreadId}
          language={props.language}
        />
      </section>
    </div>
  );
});

interface IThreadDocumentKnowledgeProps extends Pick<
  IProps,
  "subjectId" | "socialModuleProfileId" | "socialModuleChatId" | "language"
> {
  document: IAIChatDocument;
}

function ThreadDocumentKnowledge(props: IThreadDocumentKnowledgeProps) {
  const ru = props.language === "ru";
  const sources =
    api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: props.document.profileId,
      },
    );
  const linked = sources.isError
    ? []
    : sources.data?.filter((source) =>
        props.document.sourceIds.includes(source.id),
      );

  return (
    <section className="grid min-w-0 gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="size-4 shrink-0" aria-hidden="true" />
        {ru ? "Знания" : "Knowledge"}
      </h4>
      {sources.isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Загружаем источники…" : "Loading knowledge sources…"}
        </p>
      )}
      {sources.isError && (
        <p role="alert" className="text-sm text-destructive">
          {ru
            ? "Не удалось загрузить источники."
            : "Could not load knowledge sources."}
        </p>
      )}
      {linked?.map((source) => (
        <details
          key={source.id}
          className="rounded-xl border border-border bg-card px-3"
        >
          <summary className="min-h-11 cursor-pointer content-center break-words text-sm font-medium">
            {source.title}
          </summary>
          <p className="whitespace-pre-wrap break-words pb-3 text-sm">
            {readKnowledgeDocumentContent(source.content)}
          </p>
        </details>
      ))}
      {linked?.length === 0 && !sources.isError && (
        <p className="text-sm text-muted-foreground">
          {ru ? "Нет доступных источников." : "No available knowledge sources."}
        </p>
      )}
    </section>
  );
}

function ThreadFiles(
  props: Pick<
    IProps,
    | "subjectId"
    | "socialModuleProfileId"
    | "socialModuleChatId"
    | "socialModuleThreadId"
    | "isCustomerWork"
    | "language"
  >,
) {
  const ru = props.language === "ru";
  const messages = useThreadMessages(props);
  const attachments = useMemo(() => {
    const seen = new Set<string>();
    const files = (messages.data ?? []).flatMap((message) => {
      if (props.isCustomerWork || message.variant === "customer-work")
        return [];
      return (message.attachments ?? []).filter((file) => {
        if (seen.has(file.id)) return false;
        seen.add(file.id);
        return true;
      });
    });
    const privateFiles = (messages.data ?? []).filter(
      (message) => message.privateAttachments?.length,
    );
    return { files, privateFiles };
  }, [messages.data, props.isCustomerWork]);

  if (messages.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {ru ? "Не удалось загрузить файлы." : "Could not load files."}
      </p>
    );
  }
  if (messages.isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {ru ? "Загружаем файлы…" : "Loading files…"}
      </p>
    );
  }
  if (!attachments.files.length && !attachments.privateFiles.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {ru ? "В обсуждении пока нет файлов." : "This thread has no files yet."}
      </p>
    );
  }

  return (
    <div className="grid min-w-0 gap-2">
      {attachments.files.map((file) => (
        <FileStorageModuleFile
          key={file.id}
          variant="attachment-ai-chat"
          isServer={false}
          data={file}
          dataSource="props"
          language={props.language}
        />
      ))}
      {attachments.privateFiles.map((message) => (
        <PrivateMessageAttachments
          key={message.id}
          subjectId={props.subjectId}
          threadId={props.socialModuleThreadId}
          messageId={message.id}
          language={props.language}
          attachments={message.privateAttachments ?? []}
        />
      ))}
    </div>
  );
}
