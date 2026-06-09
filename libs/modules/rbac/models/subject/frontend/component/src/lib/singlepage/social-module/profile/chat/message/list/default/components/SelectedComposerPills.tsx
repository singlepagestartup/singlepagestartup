"use client";

import { SocialSkill } from "../types";
import { Component as SocialModuleSkillChatSelectedPill } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-selected-pill";
import { BookOpenText, X } from "lucide-react";

interface SelectedComposerPillsProps {
  fileNames: string[];
  isKnowledgeSearchSelected: boolean;
  language: string;
  onRemoveKnowledgeSearch: () => void;
  onRemoveSkill: (skillId: string) => void;
  skills: SocialSkill[];
}

export function SelectedComposerPills(props: SelectedComposerPillsProps) {
  if (
    !props.fileNames.length &&
    !props.skills.length &&
    !props.isKnowledgeSearchSelected
  ) {
    return null;
  }

  return (
    <div className="mx-auto mb-2 flex w-full max-w-4xl flex-wrap gap-2">
      {props.fileNames.map((fileName) => {
        return (
          <span
            key={fileName}
            className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500"
          >
            {fileName}
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
