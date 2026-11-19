"use client";

import { memo, type Ref } from "react";
import { FileText } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import {
  getAIChatDocument,
  type IAIChatDocument,
} from "@sps/rbac/models/subject/sdk/model";
import { readKnowledgeDocumentContent } from "@sps/shared-utils";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { ThreadCustomerWork } from "./ThreadCustomerWork";
import { ThreadFiles } from "./ThreadFiles";

interface IProps {
  subjectId: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
  socialModuleThread: ISocialModuleThread;
  isCustomerWork: boolean;
  hideDocumentKnowledge?: boolean;
  language: string;
  resultSectionRef: Ref<HTMLElement>;
  selectedVersionId?: string;
  onVersionSelect: (id: string) => void;
}

export const ThreadContext = memo(function ThreadContext(props: IProps) {
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
      {!props.isCustomerWork &&
      !props.hideDocumentKnowledge &&
      document?.sourceIds.length ? (
        <ThreadDocumentKnowledge
          document={document}
          subjectId={props.subjectId}
          socialModuleProfileId={props.socialModuleProfileId}
          socialModuleChatId={props.socialModuleChatId}
          language={props.language}
        />
      ) : null}
      <ThreadFiles
        isCustomerWork={props.isCustomerWork}
        subjectId={props.subjectId}
        socialModuleProfileId={props.socialModuleProfileId}
        socialModuleChatId={props.socialModuleChatId}
        socialModuleThreadId={props.socialModuleThreadId}
        language={props.language}
      />
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
