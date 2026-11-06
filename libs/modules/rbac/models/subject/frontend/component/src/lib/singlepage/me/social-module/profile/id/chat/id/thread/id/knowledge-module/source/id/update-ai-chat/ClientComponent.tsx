"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IComponentPropsExtended, ISourceFileProps } from "./interface";

const SourceFile = memo(function SourceFile({
  language,
  file,
  removing,
  onRemove,
}: ISourceFileProps) {
  const ru = language === "ru";
  const title = file.adminTitle || file.alt || (ru ? "Файл" : "File");
  return (
    <li className="relative min-w-0">
      <FileStorageModuleFile
        language={language}
        isServer={false}
        variant="attachment-ai-chat"
        data={file}
        dataSource="props"
      />
      <button
        type="button"
        aria-label={
          ru ? `Удалить ${title} из знаний` : `Remove ${title} from knowledge`
        }
        disabled={removing}
        onClick={() => onRemove(file.id)}
        className="absolute right-1 top-1 z-10 grid size-7 place-items-center rounded-full bg-foreground text-background hover:opacity-80 disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
      {removing && (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          {ru ? "Удаление…" : "Removing\u2026"}
        </p>
      )}
    </li>
  );
});
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const { data, project, source, onDiscuss } = props;
  const [expanded, setExpanded] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileStatus, setFileStatus] = useState("");
  const removalInFlight = useRef<string | null>(null);
  useEffect(() => {
    if (source.contentHash === source.indexedContentHash) setFileStatus("");
  }, [source.contentHash, source.indexedContentHash]);
  const scope = useMemo(
    () => ({
      id: data.id,
      socialModuleProfileId: project.requesterProfileId,
      socialModuleChatId: project.chat.id,
      targetSocialModuleProfileId: project.profile.id,
    }),
    [data.id, project.requesterProfileId, project.chat.id, project.profile.id],
  );
  const update =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
      { ...scope, knowledgeModuleSourceId: source.id },
    );
  const files =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate(
      {},
    );
  const attachments = {
    ...props.attachmentsRead,
    refetch: props.attachmentsRead.refetch || (() => window.location.reload()),
  };
  const discuss = useCallback(
    () => onDiscuss(source.id),
    [onDiscuss, source.id],
  );
  const remove = useCallback(
    async (fileId: string) => {
      if (removalInFlight.current !== null) {
        setFileError(
          ru
            ? "Дождитесь завершения текущей операции с файлом."
            : "Wait for the current file operation to finish.",
        );
        return;
      }
      removalInFlight.current = fileId;
      setRemovingId(fileId);
      setFileError("");
      setFileStatus("");
      try {
        const result = await files.mutateAsync({
          ...scope,
          knowledgeModuleSourceId: source.id,
          data: {
            removeFileId: fileId,
            expectedContentHash: source.contentHash,
          },
        });
        if (result.analysisPending)
          setFileStatus(
            ru
              ? "Файл удалён. Анализируем оставшиеся файлы…"
              : "File removed. Analyzing remaining files…",
          );
        if (result.processingError)
          setFileError(
            `${ru ? "Файл удалён; не удалось проанализировать материалы" : "File removed; analysis failed"}: ${result.processingError}`,
          );
      } catch (error) {
        setFileError(
          error instanceof Error
            ? error.message
            : ru
              ? "Не удалось удалить файл."
              : "File could not be removed.",
        );
      } finally {
        removalInFlight.current = null;
        setRemovingId(null);
      }
    },
    [files.mutateAsync, scope, source.id, source.contentHash, ru],
  );
  const save = useCallback(
    async (data: { title: string; content: string }) => {
      const result = await update.mutateAsync({
        ...scope,
        knowledgeModuleSourceId: source.id,
        data,
      });
      return result.indexingError
        ? `${ru ? "Сохранено; не удалось подготовить поиск" : "Saved; indexing failed"}: ${result.indexingError}`
        : ru
          ? "Сохранено"
          : "Saved";
    },
    [update.mutateAsync, scope, source.id, ru],
  );
  const attach = useCallback(
    async (data: FileList) => {
      const result = await files.mutateAsync({
        ...scope,
        knowledgeModuleSourceId: source.id,
        data: { files: Array.from(data) },
      });
      if (result.processingError)
        throw new Error(
          `${ru ? "Файлы сохранены; не удалось проанализировать материалы" : "Files saved; analysis failed"}: ${result.processingError}`,
        );
    },
    [files.mutateAsync, scope, source.id, ru],
  );
  return (
    <KnowledgeModuleSource
      language={language}
      isServer={false}
      variant="id-ai-chat"
      data={source}
      dataSource="props"
      onDiscuss={discuss}
      attachments={
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-3 text-xs text-muted-foreground">
            {ru ? "Файлы ·" : "Files ·"} {attachments.data?.length || 0}
          </p>
          {attachments.error && (
            <p role="alert" className="text-xs text-destructive">
              {attachments.error.message}
            </p>
          )}
          {fileError && (
            <p role="alert" className="mb-2 text-xs text-destructive">
              {fileError}
            </p>
          )}
          {fileStatus && (
            <p role="status" className="mb-2 text-xs text-muted-foreground">
              {fileStatus}
            </p>
          )}
          <ul
            aria-label={ru ? "Вложения знаний" : "Knowledge attachments"}
            className="grid min-w-0 grid-cols-2 gap-2"
          >
            {(expanded ? attachments.data : attachments.data?.slice(0, 2))?.map(
              ({ file, relation }) => (
                <SourceFile
                  language={language}
                  key={relation.id}
                  file={file}
                  removing={removingId === file.id}
                  onRemove={remove}
                />
              ),
            )}
          </ul>
          {(attachments.data?.length || 0) > 2 && (
            <button
              type="button"
              aria-expanded={expanded}
              className="mt-3 min-h-9 w-full rounded-lg border border-border px-3 text-xs font-semibold"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? ru
                  ? "Свернуть"
                  : "Show less"
                : ru
                  ? "Показать ещё"
                  : "Show more"}
            </button>
          )}
        </div>
      }
      onSave={save}
      onAttach={attach}
    />
  );
});
