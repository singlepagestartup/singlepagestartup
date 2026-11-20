"use client";

import { memo } from "react";
import { FilePreview } from "@sps/ui-adapter";
import { SocialSkill } from "../types";
import { Component as SocialModuleSkill } from "@sps/social/models/skill/frontend/component";
import { BookOpenText, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface SelectedComposerFile {
  id: string;
  name: string;
  file?: File;
}

interface SelectedComposerPillsProps {
  files: SelectedComposerFile[];
  isKnowledgeSearchSelected: boolean;
  language: string;
  onRemoveKnowledgeSearch: () => void;
  onRemoveFile: (fileId: string) => void;
  onReorderFile: (fileId: string, targetId: string) => void;
  onRemoveSkill: (skillId: string) => void;
  skills: SocialSkill[];
}

export function SelectedComposerPills(props: SelectedComposerPillsProps) {
  const ru = props.language === "ru";
  if (
    !props.files.length &&
    !props.skills.length &&
    !props.isKnowledgeSearchSelected
  ) {
    return null;
  }

  return (
    <div className="mb-3 flex min-w-0 flex-wrap gap-2">
      {props.files.length > 0 && (
        <ul
          aria-label={ru ? "Прикреплённые файлы" : "Attached files"}
          tabIndex={0}
          className="flex w-full min-w-0 gap-2 overflow-x-auto pb-2 focus-visible:outline-2"
        >
          {props.files.map((file, index) => (
            <ComposerAttachment
              key={file.id}
              file={file}
              previousId={props.files[index - 1]?.id}
              nextId={props.files[index + 1]?.id}
              language={props.language}
              onRemove={props.onRemoveFile}
              onReorder={props.onReorderFile}
            />
          ))}
        </ul>
      )}
      {props.isKnowledgeSearchSelected ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs text-foreground">
          <BookOpenText
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="font-medium">
            {ru ? "База знаний" : "Knowledge"}
          </span>
          <span className="text-muted-foreground">@knowledge</span>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={props.onRemoveKnowledgeSearch}
            aria-label={
              ru ? "Убрать поиск по базе знаний" : "Remove knowledge search"
            }
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}
      {props.skills.map((skill) => {
        return (
          <SocialModuleSkill
            key={skill.id}
            isServer={false}
            variant="chat-selected-pill"
            dataSource="props"
            data={skill}
            language={props.language}
            onRemove={() => {
              props.onRemoveSkill(skill.id);
            }}
          />
        );
      })}
    </div>
  );
}

interface IComposerAttachmentProps {
  file: SelectedComposerFile;
  previousId?: string;
  nextId?: string;
  language: string;
  onRemove: (id: string) => void;
  onReorder: (id: string, targetId: string) => void;
}

const ComposerAttachment = memo(function ComposerAttachment(
  props: IComposerAttachmentProps,
) {
  const { file, previousId, nextId } = props;
  const ru = props.language === "ru";
  const reorderClassName =
    "grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30";
  return (
    <li
      draggable
      className="relative w-36 shrink-0 rounded-xl border border-border bg-muted/30 p-2 sm:w-40"
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", file.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        props.onReorder(event.dataTransfer.getData("text/plain"), file.id);
      }}
    >
      <button
        type="button"
        aria-label={
          ru ? `Убрать файл ${file.name}` : `Remove attached file ${file.name}`
        }
        onClick={() => props.onRemove(file.id)}
        className="absolute right-1 top-1 z-10 grid size-7 place-items-center rounded-full bg-foreground text-background hover:opacity-80"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <FilePreview
        language={props.language}
        name={file.name}
        mimeType={file.file?.type}
        localFile={file.file}
        availability={file.file ? undefined : "unavailable"}
        className="border-0 bg-transparent"
        thumbnailClassName="h-20 rounded-lg"
      />
      <div className="mt-1 flex items-center justify-end">
        <button
          type="button"
          aria-label={
            ru ? `Переместить ${file.name} раньше` : `Move ${file.name} earlier`
          }
          disabled={!previousId}
          onClick={() => previousId && props.onReorder(file.id, previousId)}
          className={reorderClassName}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={
            ru ? `Переместить ${file.name} позже` : `Move ${file.name} later`
          }
          disabled={!nextId}
          onClick={() => nextId && props.onReorder(file.id, nextId)}
          className={reorderClassName}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
});
