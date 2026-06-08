"use client";

import { KnowledgeMentionOption, SocialSkill } from "../types";
import { Component as SocialModuleSkillChatMentionOption } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-mention-option";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@sps/shared-ui-shadcn";
import { BookOpenText } from "lucide-react";

interface SkillMentionPickerProps {
  activeIndex: number;
  isLoading: boolean;
  knowledgeOption?: KnowledgeMentionOption | null;
  language: string;
  onKnowledgeSelect: () => void;
  onSelect: (skill: SocialSkill) => void;
  skills: SocialSkill[];
}

export function SkillMentionPicker(props: SkillMentionPickerProps) {
  const hasOptions = Boolean(props.knowledgeOption) || props.skills.length > 0;
  const skillOptionOffset = props.knowledgeOption ? 1 : 0;

  return (
    <div className="mx-auto mb-2 w-full max-w-4xl rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
      <Command shouldFilter={false} className="bg-transparent">
        <CommandList className="max-h-60">
          {hasOptions ? (
            <CommandGroup>
              {props.knowledgeOption ? (
                <CommandItem
                  value={props.knowledgeOption.slug}
                  onSelect={props.onKnowledgeSelect}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                    props.activeIndex === 0
                      ? "!bg-slate-100 data-[selected=true]:!bg-slate-100"
                      : "bg-transparent data-[selected=true]:!bg-transparent",
                  )}
                >
                  <BookOpenText className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {props.knowledgeOption.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      @{props.knowledgeOption.slug}
                    </span>
                  </span>
                </CommandItem>
              ) : null}
              {props.skills.map((skill, index) => {
                const optionIndex = skillOptionOffset + index;

                return (
                  <CommandItem
                    key={skill.id}
                    value={skill.slug}
                    onSelect={() => {
                      props.onSelect(skill);
                    }}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2",
                      props.activeIndex === optionIndex
                        ? "!bg-slate-100 data-[selected=true]:!bg-slate-100"
                        : "bg-transparent data-[selected=true]:!bg-transparent",
                    )}
                  >
                    <SocialModuleSkillChatMentionOption
                      isServer={false}
                      variant="chat-mention-option"
                      data={skill}
                      language={props.language}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            <CommandEmpty className="py-6 text-center text-xs text-slate-500">
              {props.isLoading ? "Loading skills..." : "No skills found"}
            </CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
