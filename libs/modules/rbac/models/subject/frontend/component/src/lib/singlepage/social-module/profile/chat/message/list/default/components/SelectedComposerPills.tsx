"use client";

import { SocialSkill } from "../types";
import { Component as SocialModuleSkill } from "@sps/social/models/skill/frontend/component";
import { BookOpenText, Eye, FileText, X } from "lucide-react";

export interface SelectedComposerFile {
  id: string;
  name: string;
}

interface SelectedComposerPillsProps {
  files: SelectedComposerFile[];
  isKnowledgeSearchSelected: boolean;
  language: string;
  onOpenFile: (fileId: string) => void;
  onRemoveKnowledgeSearch: () => void;
  onRemoveFile: (fileId: string) => void;
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
      {props.files.map((file) => {
        return (
          <span
            key={file.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs text-foreground"
          >
            <FileText
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 max-w-48 truncate" title={file.name}>
              {file.name}
            </span>
            <button
              type="button"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                props.onOpenFile(file.id);
              }}
              aria-label={
                ru
                  ? `Скачать файл ${file.name}`
                  : `Download attached file ${file.name}`
              }
            >
              <Eye className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                props.onRemoveFile(file.id);
              }}
              aria-label={
                ru
                  ? `Убрать файл ${file.name}`
                  : `Remove attached file ${file.name}`
              }
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
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
