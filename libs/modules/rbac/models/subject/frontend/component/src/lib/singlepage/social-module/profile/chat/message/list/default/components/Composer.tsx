"use client";

import { KnowledgeCommandPicker } from "./KnowledgeCommandPicker";
import { OpenRouterControls } from "./OpenRouterControls";
import { SelectedComposerPills } from "./SelectedComposerPills";
import { SkillMentionPicker } from "./SkillMentionPicker";
import { ChatMessageFormValues } from "../schemas";
import {
  KnowledgeChatCommand,
  KnowledgeMentionOption,
  OpenRouterChatModelGroup,
  OpenRouterReasoningValue,
  SocialSkill,
} from "../types";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { Paperclip, Send, Smile } from "lucide-react";
import { Controller } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, MutableRefObject, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";

interface ComposerProps {
  canSubmit: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  form: UseFormReturn<ChatMessageFormValues>;
  isKnowledgeCommandPickerOpen: boolean;
  isKnowledgeSearchSelected: boolean;
  isArtificialIntelligenceOpponent: boolean;
  isSkillMentionPickerOpen: boolean;
  isSkillOptionsLoading: boolean;
  knowledgeMentionOption?: KnowledgeMentionOption | null;
  language: string;
  onKnowledgeCommandSelect: (commandValue: string) => void;
  onKnowledgeMentionSelect: () => void;
  onOpenRouterModelChange: (value: string) => void;
  onOpenRouterReasoningChange: (value: OpenRouterReasoningValue) => void;
  onRemoveKnowledgeSearch: () => void;
  onRemoveSelectedSkill: (skillId: string) => void;
  onSkillMentionSelect: (skill: SocialSkill) => void;
  openRouterModelGroups: OpenRouterChatModelGroup[];
  openRouterModelId: string;
  openRouterModelLabel: string;
  openRouterReasoning: OpenRouterReasoningValue;
  openRouterReasoningLabel: string;
  showOpenRouterControls: boolean;
  onSubmit: (data: ChatMessageFormValues) => Promise<void> | void;
  isOpenRouterModelsLoading: boolean;
  selectedFileNames: string[];
  selectedSkills: SocialSkill[];
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  visibleKnowledgeChatCommands: KnowledgeChatCommand[];
  visibleSkillMentionOptions: SocialSkill[];
}

export function Composer(props: ComposerProps) {
  const [activeKnowledgeCommandIndex, setActiveKnowledgeCommandIndex] =
    useState(0);
  const [activeSkillMentionOptionIndex, setActiveSkillMentionOptionIndex] =
    useState(0);
  const knowledgeCommandCount = props.visibleKnowledgeChatCommands.length;
  const skillMentionOptionCount =
    (props.knowledgeMentionOption ? 1 : 0) +
    props.visibleSkillMentionOptions.length;
  const visibleKnowledgeCommandSignature = useMemo(() => {
    return props.visibleKnowledgeChatCommands
      .map((command) => command.value)
      .join(":");
  }, [props.visibleKnowledgeChatCommands]);
  const visibleSkillMentionOptionSignature = useMemo(() => {
    return props.visibleSkillMentionOptions.map((skill) => skill.id).join(":");
  }, [props.visibleSkillMentionOptions]);

  useEffect(() => {
    setActiveKnowledgeCommandIndex(0);
  }, [props.isKnowledgeCommandPickerOpen, visibleKnowledgeCommandSignature]);

  useEffect(() => {
    setActiveSkillMentionOptionIndex(0);
  }, [
    props.isSkillMentionPickerOpen,
    props.knowledgeMentionOption?.slug,
    visibleSkillMentionOptionSignature,
  ]);

  const selectActiveSkillMentionOption = useCallback(() => {
    if (!props.isSkillMentionPickerOpen || skillMentionOptionCount <= 0) {
      return false;
    }

    if (props.knowledgeMentionOption && activeSkillMentionOptionIndex === 0) {
      props.onKnowledgeMentionSelect();
      return true;
    }

    const skillIndex =
      activeSkillMentionOptionIndex - (props.knowledgeMentionOption ? 1 : 0);
    const skill = props.visibleSkillMentionOptions[skillIndex];

    if (!skill) {
      return false;
    }

    props.onSkillMentionSelect(skill);
    return true;
  }, [activeSkillMentionOptionIndex, props, skillMentionOptionCount]);

  const selectActiveKnowledgeCommand = useCallback(() => {
    if (!props.isKnowledgeCommandPickerOpen || knowledgeCommandCount <= 0) {
      return false;
    }

    const command =
      props.visibleKnowledgeChatCommands[activeKnowledgeCommandIndex];

    if (!command) {
      return false;
    }

    props.onKnowledgeCommandSelect(command.insertValue || command.value);
    return true;
  }, [activeKnowledgeCommandIndex, knowledgeCommandCount, props]);

  function onComposerTextareaKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (props.isKnowledgeCommandPickerOpen && knowledgeCommandCount > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveKnowledgeCommandIndex((current) => {
          return (current + 1) % knowledgeCommandCount;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveKnowledgeCommandIndex((current) => {
          return (current - 1 + knowledgeCommandCount) % knowledgeCommandCount;
        });
        return;
      }

      if (event.key === "Tab" && !event.shiftKey) {
        if (selectActiveKnowledgeCommand()) {
          event.preventDefault();
        }

        return;
      }
    }

    if (props.isSkillMentionPickerOpen && skillMentionOptionCount > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSkillMentionOptionIndex((current) => {
          return (current + 1) % skillMentionOptionCount;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSkillMentionOptionIndex((current) => {
          return (
            (current - 1 + skillMentionOptionCount) % skillMentionOptionCount
          );
        });
        return;
      }

      if (event.key === "Tab" && !event.shiftKey) {
        if (selectActiveSkillMentionOption()) {
          event.preventDefault();
        }

        return;
      }
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void props.form.handleSubmit(props.onSubmit)();
    if (props.textareaRef.current) {
      props.textareaRef.current.style.height = "auto";
    }
  }

  const attachmentButton = (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:text-slate-900",
        props.isArtificialIntelligenceOpponent
          ? "hover:bg-slate-100"
          : "hover:bg-white",
      )}
      onClick={() => {
        props.fileInputRef.current?.click();
      }}
      aria-label="Attach files"
    >
      <Paperclip className="h-4 w-4" />
    </button>
  );

  const emojiButton = (
    <button
      type="button"
      className={cn(
        "hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:text-slate-900 sm:inline-flex",
        props.isArtificialIntelligenceOpponent
          ? "hover:bg-slate-100"
          : "hover:bg-white",
      )}
      aria-label="Add emoji"
    >
      <Smile className="h-4 w-4" />
    </button>
  );

  const openRouterControls = props.showOpenRouterControls ? (
    <OpenRouterControls
      isLoadingModels={props.isOpenRouterModelsLoading}
      modelGroups={props.openRouterModelGroups}
      selectedModelId={props.openRouterModelId}
      selectedModelLabel={props.openRouterModelLabel}
      selectedReasoning={props.openRouterReasoning}
      selectedReasoningLabel={props.openRouterReasoningLabel}
      onModelChange={props.onOpenRouterModelChange}
      onReasoningChange={props.onOpenRouterReasoningChange}
    />
  ) : null;

  const sendButton = (
    <Button
      type="submit"
      variant="primary"
      size="icon"
      className="h-9 w-9 shrink-0"
      disabled={!props.canSubmit}
      aria-label="Send message"
    >
      <Send className="h-4 w-4" />
    </Button>
  );

  const composerTextarea = (
    <Controller
      name="description"
      control={props.form.control}
      render={({ field }) => {
        return (
          <textarea
            {...field}
            ref={(element) => {
              field.ref(element);
              props.textareaRef.current = element;
            }}
            rows={props.isArtificialIntelligenceOpponent ? 3 : 1}
            placeholder="Write a message..."
            className={cn(
              "resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
              props.isArtificialIntelligenceOpponent
                ? "max-h-44 min-h-20 w-full px-1 py-1 leading-6"
                : "max-h-32 min-h-9 flex-1 px-1 py-2 leading-5",
            )}
            onChange={(event) => {
              field.onChange(event);
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={onComposerTextareaKeyDown}
          />
        );
      }}
    />
  );

  return (
    <Form {...props.form}>
      <form
        className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
        onSubmit={props.form.handleSubmit(props.onSubmit)}
      >
        <SelectedComposerPills
          fileNames={props.selectedFileNames}
          isKnowledgeSearchSelected={props.isKnowledgeSearchSelected}
          skills={props.selectedSkills}
          language={props.language}
          onRemoveKnowledgeSearch={props.onRemoveKnowledgeSearch}
          onRemoveSkill={props.onRemoveSelectedSkill}
        />
        {props.isKnowledgeCommandPickerOpen ? (
          <KnowledgeCommandPicker
            activeIndex={activeKnowledgeCommandIndex}
            commands={props.visibleKnowledgeChatCommands}
            onSelect={(command) => {
              props.onKnowledgeCommandSelect(
                command.insertValue || command.value,
              );
            }}
          />
        ) : null}
        {props.isSkillMentionPickerOpen ? (
          <SkillMentionPicker
            activeIndex={activeSkillMentionOptionIndex}
            isLoading={props.isSkillOptionsLoading}
            knowledgeOption={props.knowledgeMentionOption}
            language={props.language}
            skills={props.visibleSkillMentionOptions}
            onKnowledgeSelect={props.onKnowledgeMentionSelect}
            onSelect={props.onSkillMentionSelect}
          />
        ) : null}
        <input
          ref={props.fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files
              ? Array.from(event.target.files)
              : undefined;

            props.form.setValue("files", files, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
        {props.isArtificialIntelligenceOpponent ? (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {composerTextarea}
            <div className="flex items-center gap-2">
              {attachmentButton}
              {emojiButton}
              <div className="min-w-0 flex-1" />
              {openRouterControls}
              {sendButton}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            {attachmentButton}
            {composerTextarea}
            {emojiButton}
            {openRouterControls}
            {sendButton}
          </div>
        )}
      </form>
    </Form>
  );
}
