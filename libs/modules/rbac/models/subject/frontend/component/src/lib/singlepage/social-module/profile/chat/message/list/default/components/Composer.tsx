"use client";

import { KnowledgeCommandPicker } from "./KnowledgeCommandPicker";
import { OpenRouterControls } from "./OpenRouterControls";
import {
  SelectedComposerPills,
  type SelectedComposerFile,
} from "./SelectedComposerPills";
import { SkillMentionPicker } from "./SkillMentionPicker";
import { useChatComposer } from "../hooks/use-chat-composer";
import { ThreadMessagesCache } from "../hooks/use-thread-messages-refetch";
import {
  OpenRouterChatModelGroup,
  OpenRouterReasoningValue,
  SocialSkill,
} from "../types";
import {
  filterSkillMentionOptions,
  getKnowledgeCommandMatch,
  getSkillMentionMatch,
  hasKnowledgeMention,
  knowledgeChatCommands,
  knowledgeMentionOption,
  shouldShowKnowledgeMentionOption,
} from "../utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { Paperclip, Send, Smile } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

interface ComposerProps {
  assistantProfileId?: string;
  canUseKnowledge: boolean;
  clearSelectedSkills: () => void;
  isArtificialIntelligenceOpponent: boolean;
  isOpenRouterModelsLoading: boolean;
  isSkillOptionsLoading: boolean;
  language: string;
  /**
   * Stable callback-ref bridge to the timeline boundary: marks that the next
   * timeline render should scroll to bottom. No message-array props cross the
   * composer boundary (issue #195).
   */
  markShouldScrollToBottom: () => void;
  onKnowledgeReactionSuccess: () => void;
  onOpenRouterModelChange: (value: string) => void;
  onOpenRouterReasoningChange: (value: OpenRouterReasoningValue) => void;
  onRemoveSelectedSkill: (skillId: string) => void;
  onSkillSelect: (skill: SocialSkill) => void;
  openRouterModelGroups: OpenRouterChatModelGroup[];
  openRouterModelId: string;
  openRouterModelLabel: string;
  openRouterReasoning: OpenRouterReasoningValue;
  openRouterReasoningLabel: string;
  profileSkills: SocialSkill[];
  /** Lets the shell focus the textarea (e.g. after a skill is saved). */
  registerFocusComposerTextArea: (focus: () => void) => void;
  selectedSkillIds: string[];
  selectedSkills: SocialSkill[];
  showOpenRouterControls: boolean;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
  syncSelectedSkillsToDescription: (description?: string | null) => void;
  threadMessagesCache: ThreadMessagesCache;
}

/**
 * Composer boundary (issue #195): owns the message form AND the create /
 * AI-reaction mutations. Keystrokes, submit pending-state flips, and the
 * create-success cache append all stay inside this component — the chat shell
 * and the timeline section never rerender because of composer activity.
 */
export function Composer(props: ComposerProps) {
  const composer = useChatComposer({
    subjectId: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
    assistantProfileId: props.assistantProfileId,
    clearSelectedSkills: props.clearSelectedSkills,
    markShouldScrollToBottom: props.markShouldScrollToBottom,
    onKnowledgeReactionSuccess: props.onKnowledgeReactionSuccess,
    openRouterModelId: props.openRouterModelId,
    openRouterReasoning: props.openRouterReasoning,
    profileSkills: props.profileSkills,
    selectedSkillIds: props.selectedSkillIds,
    threadMessagesCache: props.threadMessagesCache,
  });

  const [activeKnowledgeCommandIndex, setActiveKnowledgeCommandIndex] =
    useState(0);
  const [activeSkillMentionOptionIndex, setActiveSkillMentionOptionIndex] =
    useState(0);

  // Reactive form subscriptions live HERE, at the lowest component that needs
  // them, so composer keystrokes rerender only the composer - never the
  // message timeline (issue #195 rerender isolation). useWatch (not
  // form.watch) is mandatory: form.watch re-renders the useForm host
  // component.
  const description = useWatch({
    control: composer.form.control,
    name: "description",
  });
  const selectedFiles = useWatch({
    control: composer.form.control,
    name: "files",
  });

  useEffect(() => {
    props.registerFocusComposerTextArea(composer.focusComposerTextArea);
  }, [composer.focusComposerTextArea, props.registerFocusComposerTextArea]);

  // Keeps selected skills in sync with typed @mentions. The skill-selection
  // state lives in the shell, but its setter bails out when nothing changed,
  // so plain typing does not rerender the shell.
  useEffect(() => {
    props.syncSelectedSkillsToDescription(description);
  }, [description, props.syncSelectedSkillsToDescription]);

  function getSelectedFileId(file: unknown, index: number) {
    if (typeof file === "string") {
      return `string:${index}:${file}`;
    }

    if (typeof File !== "undefined" && file instanceof File) {
      return `file:${index}:${file.name}:${file.size}:${file.lastModified}`;
    }

    return `unknown:${index}`;
  }

  function isFileArray(files: unknown[]): files is File[] {
    return (
      typeof File !== "undefined" &&
      files.every((file) => {
        return file instanceof File;
      })
    );
  }

  function isStringArray(files: unknown[]): files is string[] {
    return files.every((file) => {
      return typeof file === "string";
    });
  }

  const selectedFileItems = useMemo<SelectedComposerFile[]>(() => {
    if (!Array.isArray(selectedFiles)) {
      return [];
    }

    return selectedFiles.map((file, index) => {
      return {
        id: getSelectedFileId(file, index),
        name: typeof file === "string" ? file : file.name,
      };
    });
  }, [selectedFiles]);
  const canSubmit =
    Boolean(description?.trim()) && !composer.createMessage.isPending;

  const knowledgeCommandMatch = getKnowledgeCommandMatch(description);
  const commandQuery = knowledgeCommandMatch?.query || "";
  const visibleKnowledgeChatCommands = useMemo(() => {
    if (!props.canUseKnowledge || !knowledgeCommandMatch) {
      return [];
    }

    const normalizedQuery = commandQuery.toLowerCase();
    const commandNeedle = normalizedQuery ? `/${normalizedQuery}` : "";

    return knowledgeChatCommands.filter((command) => {
      return (
        command.value.toLowerCase().includes(commandNeedle) ||
        command.title.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [commandQuery, knowledgeCommandMatch, props.canUseKnowledge]);
  const isKnowledgeCommandPickerOpen =
    props.canUseKnowledge && Boolean(knowledgeCommandMatch);
  const visibleSkillMentionOptions = useMemo(() => {
    return filterSkillMentionOptions(props.profileSkills, description);
  }, [description, props.profileSkills]);
  const visibleKnowledgeMentionOption =
    props.canUseKnowledge && shouldShowKnowledgeMentionOption(description)
      ? knowledgeMentionOption
      : null;
  const isKnowledgeSearchSelected = hasKnowledgeMention(description);
  const isSkillMentionPickerOpen =
    Boolean(getSkillMentionMatch(description)) && !isKnowledgeCommandPickerOpen;

  const knowledgeCommandCount = visibleKnowledgeChatCommands.length;
  const skillMentionOptionCount =
    (visibleKnowledgeMentionOption ? 1 : 0) + visibleSkillMentionOptions.length;
  const visibleKnowledgeCommandSignature = useMemo(() => {
    return visibleKnowledgeChatCommands
      .map((command) => command.value)
      .join(":");
  }, [visibleKnowledgeChatCommands]);
  const visibleSkillMentionOptionSignature = useMemo(() => {
    return visibleSkillMentionOptions.map((skill) => skill.id).join(":");
  }, [visibleSkillMentionOptions]);

  useEffect(() => {
    setActiveKnowledgeCommandIndex(0);
  }, [isKnowledgeCommandPickerOpen, visibleKnowledgeCommandSignature]);

  useEffect(() => {
    setActiveSkillMentionOptionIndex(0);
  }, [
    isSkillMentionPickerOpen,
    visibleKnowledgeMentionOption?.slug,
    visibleSkillMentionOptionSignature,
  ]);

  function selectKnowledgeCommand(commandValue: string) {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getKnowledgeCommandMatch(currentDescription);
    const resolvedCommandValue =
      hasKnowledgeMention(currentDescription) &&
      commandValue.toLowerCase().startsWith("@knowledge ")
        ? commandValue.replace(/^@knowledge\s+/i, "")
        : commandValue;
    const nextDescription = currentMatch
      ? `${currentDescription.slice(
          0,
          currentMatch.startIndex,
        )}${resolvedCommandValue} `
      : `${currentDescription.trimEnd()} ${resolvedCommandValue} `.trimStart();

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function selectKnowledgeMention() {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getSkillMentionMatch(currentDescription);
    const nextDescription = currentMatch
      ? `${currentDescription.slice(0, currentMatch.startIndex)}@knowledge `
      : `${currentDescription.trimEnd()} @knowledge `;

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function removeKnowledgeMention() {
    const currentDescription = composer.form.getValues("description") || "";
    const nextDescription = currentDescription
      .replace(/(^|\s)@knowledge(?=\s|$)\s*/i, "$1")
      .replace(/\s{2,}/g, " ")
      .trimStart();

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function openSelectedFile(fileId: string) {
    const files = composer.form.getValues("files");

    if (!Array.isArray(files)) {
      return;
    }

    const file = files.find((item, index) => {
      return getSelectedFileId(item, index) === fileId;
    });

    if (!(typeof File !== "undefined" && file instanceof File)) {
      toast.error("Selected file preview is unavailable");
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const previewWindow = window.open(fileUrl, "_blank", "noopener,noreferrer");

    window.setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 30_000);

    if (!previewWindow) {
      toast.error("Browser blocked the file preview window");
    }
  }

  function removeSelectedFile(fileId: string) {
    const files = composer.form.getValues("files");

    if (!Array.isArray(files)) {
      return;
    }

    const nextFiles = files.filter((file, index) => {
      return getSelectedFileId(file, index) !== fileId;
    });
    const nextValue =
      nextFiles.length && isFileArray(nextFiles)
        ? nextFiles
        : nextFiles.length && isStringArray(nextFiles)
          ? nextFiles
          : undefined;

    composer.form.setValue("files", nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (composer.fileInputRef.current) {
      composer.fileInputRef.current.value = "";
    }
  }

  function selectSkillMention(skill: SocialSkill) {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getSkillMentionMatch(currentDescription);
    const nextDescription = currentMatch
      ? `${currentDescription.slice(0, currentMatch.startIndex)}@${skill.slug} `
      : `${currentDescription.trimEnd()} @${skill.slug} `;

    props.onSkillSelect(skill);
    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  const selectActiveSkillMentionOption = useCallback(() => {
    if (!isSkillMentionPickerOpen || skillMentionOptionCount <= 0) {
      return false;
    }

    if (visibleKnowledgeMentionOption && activeSkillMentionOptionIndex === 0) {
      selectKnowledgeMention();
      return true;
    }

    const skillIndex =
      activeSkillMentionOptionIndex - (visibleKnowledgeMentionOption ? 1 : 0);
    const skill = visibleSkillMentionOptions[skillIndex];

    if (!skill) {
      return false;
    }

    selectSkillMention(skill);
    return true;
  }, [
    activeSkillMentionOptionIndex,
    isSkillMentionPickerOpen,
    skillMentionOptionCount,
    visibleKnowledgeMentionOption,
    visibleSkillMentionOptions,
  ]);

  const selectActiveKnowledgeCommand = useCallback(() => {
    if (!isKnowledgeCommandPickerOpen || knowledgeCommandCount <= 0) {
      return false;
    }

    const command = visibleKnowledgeChatCommands[activeKnowledgeCommandIndex];

    if (!command) {
      return false;
    }

    selectKnowledgeCommand(command.insertValue || command.value);
    return true;
  }, [
    activeKnowledgeCommandIndex,
    isKnowledgeCommandPickerOpen,
    knowledgeCommandCount,
    visibleKnowledgeChatCommands,
  ]);

  function onComposerTextareaKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (isKnowledgeCommandPickerOpen && knowledgeCommandCount > 0) {
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

    if (isSkillMentionPickerOpen && skillMentionOptionCount > 0) {
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
    void composer.form.handleSubmit(composer.onSubmit)();
    if (composer.textareaRef.current) {
      composer.textareaRef.current.style.height = "auto";
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
        composer.fileInputRef.current?.click();
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
      disabled={!canSubmit}
      aria-label="Send message"
    >
      <Send className="h-4 w-4" />
    </Button>
  );

  const composerTextarea = (
    <Controller
      name="description"
      control={composer.form.control}
      render={({ field }) => {
        return (
          <textarea
            {...field}
            ref={(element) => {
              field.ref(element);
              composer.textareaRef.current = element;
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
    <Form {...composer.form}>
      <form
        className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
        onSubmit={composer.form.handleSubmit(composer.onSubmit)}
      >
        <SelectedComposerPills
          files={selectedFileItems}
          isKnowledgeSearchSelected={isKnowledgeSearchSelected}
          skills={props.selectedSkills}
          language={props.language}
          onOpenFile={openSelectedFile}
          onRemoveKnowledgeSearch={removeKnowledgeMention}
          onRemoveFile={removeSelectedFile}
          onRemoveSkill={props.onRemoveSelectedSkill}
        />
        {isKnowledgeCommandPickerOpen ? (
          <KnowledgeCommandPicker
            activeIndex={activeKnowledgeCommandIndex}
            commands={visibleKnowledgeChatCommands}
            onSelect={(command) => {
              selectKnowledgeCommand(command.insertValue || command.value);
            }}
          />
        ) : null}
        {isSkillMentionPickerOpen ? (
          <SkillMentionPicker
            activeIndex={activeSkillMentionOptionIndex}
            isLoading={props.isSkillOptionsLoading}
            knowledgeOption={visibleKnowledgeMentionOption}
            language={props.language}
            skills={visibleSkillMentionOptions}
            onKnowledgeSelect={selectKnowledgeMention}
            onSelect={selectSkillMention}
          />
        ) : null}
        <input
          ref={composer.fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files
              ? Array.from(event.target.files)
              : undefined;

            composer.form.setValue("files", files, {
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
