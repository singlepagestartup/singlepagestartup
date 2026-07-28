"use client";

import { SocialSkill } from "../types";
import { Component as SocialModuleSkillChatSelectedPill } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-selected-pill";
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
  if (
    !props.files.length &&
    !props.skills.length &&
    !props.isKnowledgeSearchSelected
  ) {
    return null;
  }

  return (
    <div className="mx-auto mb-2 flex w-full max-w-4xl flex-wrap gap-2">
      {props.files.map((file) => {
        return (
          <span
            key={file.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="min-w-0 max-w-48 truncate">{file.name}</span>
            <button
              type="button"
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                props.onOpenFile(file.id);
              }}
              aria-label={`Open attached file ${file.name}`}
            >
              <Eye className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                props.onRemoveFile(file.id);
              }}
              aria-label={`Remove attached file ${file.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
      {props.isKnowledgeSearchSelected ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm">
          <BookOpenText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="font-medium text-slate-900">Knowledge</span>
          <span className="text-slate-500">@knowledge</span>
          <button
            type="button"
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={props.onRemoveKnowledgeSearch}
            aria-label="Remove knowledge search"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}
      {props.skills.map((skill) => {
        return (
          <SocialModuleSkillChatSelectedPill
            key={skill.id}
            isServer={false}
            variant="chat-selected-pill"
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
