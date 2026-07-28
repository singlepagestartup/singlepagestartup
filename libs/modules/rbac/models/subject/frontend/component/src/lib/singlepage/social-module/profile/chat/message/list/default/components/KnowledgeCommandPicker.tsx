"use client";

import { KnowledgeChatCommand, SocialSkill } from "../types";
import { Component as SocialModuleSkillChatMentionOption } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-mention-option";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@sps/shared-ui-shadcn";
import { BookOpenCheck } from "lucide-react";

interface KnowledgeCommandPickerProps {
  activeIndex: number;
  commands: KnowledgeChatCommand[];
  language: string;
  onSelect: (command: KnowledgeChatCommand) => void;
  onSkillSelect: (skill: SocialSkill) => void;
  skills: SocialSkill[];
}

export function KnowledgeCommandPicker(props: KnowledgeCommandPickerProps) {
  const hasOptions = props.commands.length > 0 || props.skills.length > 0;
  const skillOptionOffset = props.commands.length;

  return (
    <div className="mx-auto mb-2 w-full max-w-4xl rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
      <Command shouldFilter={false} className="bg-transparent">
        <CommandList className="max-h-56">
          {hasOptions ? (
            <CommandGroup>
              {props.commands.map((command, commandIndex) => {
                return (
                  <CommandItem
                    key={command.value}
                    value={command.value}
                    onSelect={() => {
                      props.onSelect(command);
                    }}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2",
                      props.activeIndex === commandIndex
                        ? "!bg-slate-100 data-[selected=true]:!bg-slate-100"
                        : "bg-transparent data-[selected=true]:!bg-transparent",
                    )}
                  >
                    <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        {command.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {command.value}
                      </span>
                      <span className="block text-xs leading-5 text-slate-500">
                        {command.description}
                      </span>
                    </span>
                  </CommandItem>
                );
              })}
              {props.skills.map((skill, skillIndex) => {
                const optionIndex = skillOptionOffset + skillIndex;

                return (
                  <CommandItem
                    key={skill.id}
                    value={skill.slug}
                    onSelect={() => {
                      props.onSkillSelect(skill);
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
                      mentionPrefix="/"
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            <CommandEmpty className="py-6 text-center text-xs text-slate-500">
              No commands or skills found
            </CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
