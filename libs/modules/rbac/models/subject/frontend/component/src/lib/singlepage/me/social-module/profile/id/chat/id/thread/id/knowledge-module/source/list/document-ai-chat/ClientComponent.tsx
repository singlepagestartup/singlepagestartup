"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import {
  AI_CHAT_DOCUMENTS,
  AI_CHAT_COMPETITOR_INTAKE,
  assertSupportedAiChatAttachments,
} from "@sps/shared-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import type { IModel as ISource } from "@sps/knowledge/models/source/sdk/model";
import type { IComponentPropsExtended, IDraftSourceProps } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const project = props.project;
  const thread = props.thread;
  const selectedThreadId = thread.id;
  const scope = useMemo(
    () => ({
      id: props.data.id,
      socialModuleProfileId: project.requesterProfileId,
      socialModuleChatId: project.chat.id,
      targetSocialModuleProfileId: project.profile.id,
    }),
    [
      props.data.id,
      project.requesterProfileId,
      project.chat.id,
      project.profile.id,
    ],
  );
  const sources = {
    ...props.sourcesRead,
    refetch: props.sourcesRead.refetch || (() => window.location.reload()),
  };
  const createSource =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceCreate(
      scope,
    );
  const updateDraftSource =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
      { ...scope, knowledgeModuleSourceId: "" },
    );
  const uploadFiles =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate(
      {},
    );
  const uploadedDraftFiles = useRef(new Map<string, Set<File>>());
  const updateThread = subjectApi.socialModuleChatFindByIdThreadUpdate({
    id: scope.id,
    socialModuleChatId: scope.socialModuleChatId,
    socialModuleThreadId: selectedThreadId,
  });
  const document = useMemo(
    () => getAIChatDocument(thread.metadata),
    [thread.metadata],
  );
  const prompt = AI_CHAT_DOCUMENTS.find(
    (definition) => definition.key === document?.key,
  )?.prompt;
  const competitorIntake = document
    ? AI_CHAT_COMPETITOR_INTAKE[document.key]
    : undefined;
  const documentRef = useRef(document);
  useEffect(() => {
    documentRef.current = document;
  }, [document]);
  const savedDrafts = useRef(
    new Map<string, ISource & { indexingError?: string }>(),
  );
  const attachQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const initializedDraft = useRef(false);
  const documentSources =
    document?.profileId === project.profile.id
      ? (sources.data || []).filter((source) =>
          document.sourceIds.includes(source.id),
        )
      : [];
  useEffect(() => {
    if (sources.data === undefined || initializedDraft.current) return;
    initializedDraft.current = true;
    if (!documentSources.length) setDraftIds(["initial"]);
  }, [sources.data, documentSources.length]);
  const onDiscuss = props.onDiscuss;
  const saveDraft = useCallback(
    async (
      draftId: string,
      value: { title: string; content: string },
      files: File[] = [],
    ): Promise<string> => {
      if (
        !documentRef.current ||
        documentRef.current.profileId !== project.profile.id
      )
        throw new Error(
          ru
            ? "Разделы знаний относятся к документам проекта."
            : "Knowledge sections belong to project documents.",
        );
      assertSupportedAiChatAttachments(files);
      let source = savedDrafts.current.get(draftId);
      if (!source) {
        source = await createSource.mutateAsync({ ...scope, data: value });
        savedDrafts.current.set(draftId, source);
      } else if (
        source.title !== value.title ||
        source.content !== value.content
      ) {
        source = await updateDraftSource.mutateAsync({
          ...scope,
          knowledgeModuleSourceId: source.id,
          data: value,
        });
        savedDrafts.current.set(draftId, source);
      }
      const uploaded =
        uploadedDraftFiles.current.get(draftId) || new Set<File>();
      const pendingFiles = files.filter((file) => !uploaded.has(file));
      let processingError: string | undefined;
      if (pendingFiles.length) {
        const result = await uploadFiles.mutateAsync({
          ...scope,
          knowledgeModuleSourceId: source.id,
          data: { files: pendingFiles },
        });
        pendingFiles.forEach((file) => uploaded.add(file));
        uploadedDraftFiles.current.set(draftId, uploaded);
        processingError = result.processingError;
      }
      const savedSource = source;
      const attachment = attachQueue.current
        .catch(() => undefined)
        .then(async () => {
          const sourceIds = [
            ...new Set([
              ...(documentRef.current?.sourceIds || []),
              savedSource.id,
            ]),
          ];
          const updated = await updateThread.mutateAsync({
            id: scope.id,
            socialModuleChatId: scope.socialModuleChatId,
            socialModuleThreadId: selectedThreadId,
            data: { document: { ...documentRef.current!, sourceIds } },
          });
          documentRef.current = getAIChatDocument(updated.metadata);
          setDraftIds((ids) => ids.filter((id) => id !== draftId));
          savedDrafts.current.delete(draftId);
          uploadedDraftFiles.current.delete(draftId);
        });
      attachQueue.current = attachment;
      try {
        await attachment;
      } catch (error) {
        throw new Error(
          `${ru ? "Знания сохранены, но их не удалось прикрепить к обсуждению. Нажмите «Сохранить знания» ещё раз, чтобы прикрепить сохранённый раздел." : "Knowledge was saved, but could not be attached to this Thread. Retry Save knowledge to attach the saved section."} ${error instanceof Error ? error.message : ""}`,
        );
      }
      if (processingError)
        return `${ru ? "Сохранено; не удалось проанализировать файлы" : "Saved; file analysis failed"}: ${processingError}`;
      return savedSource.indexingError
        ? `${ru ? "Сохранено; не удалось подготовить поиск" : "Saved; indexing failed"}: ${savedSource.indexingError}`
        : ru
          ? "Сохранено"
          : "Saved";
    },
    [
      createSource.mutateAsync,
      updateDraftSource.mutateAsync,
      updateThread.mutateAsync,
      uploadFiles.mutateAsync,
      scope,
      selectedThreadId,
      project.profile.id,
      ,
      ru,
    ],
  );

  if (sources.data === undefined)
    return sources.error ? (
      <div role="alert">
        <p>{sources.error.message}</p>
        <button type="button" onClick={() => void sources.refetch()}>
          {ru ? "Повторить" : "Retry"}
        </button>
      </div>
    ) : (
      <p role="status" aria-busy="true">
        {ru ? "Загрузка разделов знаний…" : "Loading knowledge sections…"}
      </p>
    );

  return (
    <>
      {sources.error && <p role="alert">{sources.error.message}</p>}
      {competitorIntake && (
        <section className="grid gap-2">
          <h4 className="text-sm font-semibold">{competitorIntake.title}</h4>
          <p className="text-xs leading-5 text-muted-foreground">
            {competitorIntake.prompt}
          </p>
        </section>
      )}
      {documentSources.map((source) => (
        <Subject
          language={props.language}
          key={source.id}
          source={source}
          isServer={false}
          dataSource="props"
          variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat"
          data={props.data}
          project={project}
          onDiscuss={onDiscuss}
        />
      ))}
      {draftIds.map((id) => (
        <DraftSource
          language={language}
          key={id}
          id={id}
          hasSavedSources={documentSources.length > 0}
          title={id === "initial" ? thread.title?.replace(/\.md$/, "") : ""}
          placeholder={prompt}
          onSave={saveDraft}
        />
      ))}
      <button
        type="button"
        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold"
        onClick={() => setDraftIds((ids) => [...ids, crypto.randomUUID()])}
      >
        <Plus className="size-4" />

        {ru ? "Добавить раздел знаний" : "Add knowledge section"}
      </button>
    </>
  );
}

const DraftSource = memo(function DraftSource({
  language = internationalization.defaultLanguage.code,
  id,
  hasSavedSources,
  title,
  placeholder,
  onSave,
}: IDraftSourceProps) {
  const ru = language === "ru";
  const [files, setFiles] = useState<File[]>([]);
  const touched = useRef(false);
  const markTouched = useCallback(() => {
    touched.current = true;
  }, []);
  const attach = useCallback(
    async (selected: FileList) => {
      setFiles((current) => [...current, ...Array.from(selected)]);
      return ru
        ? "Файлы выбраны. Сохраните знания, чтобы прикрепить их."
        : "Files selected. Save knowledge to attach them.";
    },
    [ru],
  );
  const save = useCallback(
    (value: { title: string; content: string }) => onSave(id, value, files),
    [id, onSave, files],
  );
  if (id === "initial" && hasSavedSources && !touched.current && !files.length)
    return null;
  return (
    <div className="contents" onChangeCapture={markTouched}>
      <KnowledgeModuleSource
        language={language}
        isServer={false}
        variant="form-ai-chat"
        title={title}
        placeholder={placeholder}
        onSave={save}
        onAttach={attach}
        attachments={
          files.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p>
                {ru ? "Файлы ·" : "Files ·"}
                {files.length}
              </p>
              {files.map((file, index) => (
                <p key={`${file.name}:${file.lastModified}:${index}`}>
                  {file.name}
                </p>
              ))}
              <p className="mt-2">
                {ru
                  ? "Выбранные файлы прикрепятся при сохранении знаний."
                  : "Selected files are attached when you save this knowledge."}
              </p>
            </div>
          ) : undefined
        }
      />
    </div>
  );
});
