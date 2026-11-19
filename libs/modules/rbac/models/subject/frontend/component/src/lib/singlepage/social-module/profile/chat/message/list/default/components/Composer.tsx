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
  OpenRouterReasoningOption,
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
import { Form } from "@sps/shared-ui-shadcn";
import { Paperclip, Send } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

interface ComposerProps {
  isCustomerWork: boolean;
  canSelectOpenRouterReasoning: boolean;
  canUseKnowledge: boolean;
  clearSelectedSkills: () => void;
  isArtificialIntelligenceOpponent: boolean;
  isOpenRouterModelFavoritesUpdating: boolean;
  isOpenRouterModelsLoading: boolean;
  isSkillOptionsLoading: boolean;
  language: string;
  /**
   * Stable callback-ref bridge to the timeline boundary: marks that the next
   * timeline render should scroll to bottom. No message-array props cross the
   * composer boundary (issue #195).
   */
  markShouldScrollToBottom: () => void;
  onOpenRouterModelFavoriteToggle: (modelId: string) => void;
  onOpenRouterModelChange: (value: string) => void;
  onOpenRouterReasoningChange: (value: OpenRouterReasoningValue) => void;
  onRemoveSelectedSkill: (skillId: string) => void;
  onSkillSelect: (skill: SocialSkill) => void;
  openRouterFavoriteModelIds: string[];
  openRouterModelGroups: OpenRouterChatModelGroup[];
  openRouterModelId: string;
  openRouterModelLabel: string;
  openRouterReasoning: OpenRouterReasoningValue;
  openRouterReasoningLabel: string;
  openRouterReasoningOptions: OpenRouterReasoningOption[];
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
 * Composer boundary (issue #195): owns the message form and the single create
 * mutation. AI reaction intent is persisted with that message and all
 * orchestration stays on the backend. Keystrokes, submit pending-state flips,
 * and the create-success cache append stay inside this component — the chat
 * shell and timeline never rerender because of composer activity.
 */
export function Composer(props: ComposerProps) {
  const ru = props.language === "ru";
  const composer = useChatComposer({
    isCustomerWork: props.isCustomerWork,
    subjectId: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
    clearSelectedSkills: props.clearSelectedSkills,
    markShouldScrollToBottom: props.markShouldScrollToBottom,
    openRouterModelId: props.openRouterModelId,
    openRouterReasoning: props.openRouterReasoning,
    persistAiReactionRequest: props.isArtificialIntelligenceOpponent,
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

  // Keeps selected skills in sync with typed /skill commands. The skill-selection
  // state lives in the shell, but its setter bails out when nothing changed,
  // so plain typing does not rerender the shell.
  useEffect(() => {
    props.syncSelectedSkillsToDescription(description);
  }, [description, props.syncSelectedSkillsToDescription]);

  const fileSequence = useRef(0);
  const fileIds = useRef(new WeakMap<File, string>());

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
        id:
          typeof file === "string"
            ? `stored:${index}:${file}`
            : (fileIds.current.get(file) ?? `local:${index}`),
        name: typeof file === "string" ? file : file.name,
        file: typeof file === "string" ? undefined : file,
      };
    });
  }, [selectedFiles]);
  const canSubmit =
    (Boolean(description?.trim()) || selectedFileItems.length > 0) &&
    !composer.createMessage.isPending;

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
  const visibleSlashSkillOptions = useMemo(() => {
    return filterSkillMentionOptions(props.profileSkills, description);
  }, [description, props.profileSkills]);
  const isKnowledgeCommandPickerOpen =
    props.canUseKnowledge && Boolean(knowledgeCommandMatch);
  const visibleKnowledgeMentionOption =
    props.canUseKnowledge && shouldShowKnowledgeMentionOption(description)
      ? knowledgeMentionOption
      : null;
  const isKnowledgeSearchSelected = hasKnowledgeMention(description);
  const isSkillMentionPickerOpen =
    Boolean(getSkillMentionMatch(description)) && !isKnowledgeCommandPickerOpen;

  const knowledgeCommandCount =
    visibleKnowledgeChatCommands.length + visibleSlashSkillOptions.length;
  const skillMentionOptionCount = visibleKnowledgeMentionOption ? 1 : 0;
  const visibleKnowledgeCommandSignature = useMemo(() => {
    return [
      ...visibleKnowledgeChatCommands.map((command) => command.value),
      ...visibleSlashSkillOptions.map((skill) => skill.id),
    ].join(":");
  }, [visibleKnowledgeChatCommands, visibleSlashSkillOptions]);
  useEffect(() => {
    setActiveKnowledgeCommandIndex(0);
  }, [isKnowledgeCommandPickerOpen, visibleKnowledgeCommandSignature]);

  useEffect(() => {
    setActiveSkillMentionOptionIndex(0);
  }, [isSkillMentionPickerOpen, visibleKnowledgeMentionOption?.slug]);

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

  function selectSkillMention(skill: SocialSkill) {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getKnowledgeCommandMatch(currentDescription);
    const nextDescription = currentMatch
      ? `${currentDescription.slice(0, currentMatch.startIndex)}/${skill.slug} `
      : `${currentDescription.trimEnd()} /${skill.slug} `.trimStart();

    props.onSkillSelect(skill);
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
      .replace(/(^|\s)\/knowledge(?=\s|$)\s*/i, "$1")
      .replace(/\s{2,}/g, " ")
      .trimStart();

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function removeSelectedSkill(skillId: string) {
    const skill = props.profileSkills.find((item) => {
      return item.id === skillId;
    });

    if (skill) {
      const currentDescription = composer.form.getValues("description") || "";
      const escapedSlug = skill.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nextDescription = currentDescription
        .replace(new RegExp(`(^|\\s)/${escapedSlug}(?=\\s|$)\\s*`, "i"), "$1")
        .replace(/\s{2,}/g, " ")
        .trimStart();

      composer.form.setValue("description", nextDescription, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    props.onRemoveSelectedSkill(skillId);
    composer.focusComposerTextArea();
  }

  const removeSelectedFile = useCallback(
    (fileId: string) => {
      const index = selectedFileItems.findIndex((item) => item.id === fileId);
      const files = composer.form.getValues("files");
      if (index < 0 || !files) return;
      const nextFiles = files.filter((_, itemIndex) => itemIndex !== index);
      const nextValue = nextFiles.length
        ? isFileArray(nextFiles) || isStringArray(nextFiles)
          ? nextFiles
          : undefined
        : undefined;

      composer.form.setValue("files", nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (composer.fileInputRef.current) {
        composer.fileInputRef.current.value = "";
      }
    },
    [composer.fileInputRef, composer.form, selectedFileItems],
  );

  const reorderSelectedFile = useCallback(
    (fileId: string, targetId: string) => {
      const from = selectedFileItems.findIndex((item) => item.id === fileId);
      const to = selectedFileItems.findIndex((item) => item.id === targetId);
      const files = composer.form.getValues("files");
      if (from < 0 || to < 0 || from === to || !files) return;
      const nextFiles = [...files];
      const [moved] = nextFiles.splice(from, 1);
      nextFiles.splice(to, 0, moved);
      if (isFileArray(nextFiles) || isStringArray(nextFiles)) {
        composer.form.setValue("files", nextFiles, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [composer.form, selectedFileItems],
  );

  const selectActiveSkillMentionOption = useCallback(() => {
    if (!isSkillMentionPickerOpen || skillMentionOptionCount <= 0) {
      return false;
    }

    if (visibleKnowledgeMentionOption && activeSkillMentionOptionIndex === 0) {
      selectKnowledgeMention();
      return true;
    }

    return false;
  }, [
    activeSkillMentionOptionIndex,
    isSkillMentionPickerOpen,
    skillMentionOptionCount,
    visibleKnowledgeMentionOption,
  ]);

  const selectActiveKnowledgeCommand = useCallback(() => {
    if (!isKnowledgeCommandPickerOpen || knowledgeCommandCount <= 0) {
      return false;
    }

    const command = visibleKnowledgeChatCommands[activeKnowledgeCommandIndex];

    if (command) {
      selectKnowledgeCommand(command.insertValue || command.value);
      return true;
    }

    const skill =
      visibleSlashSkillOptions[
        activeKnowledgeCommandIndex - visibleKnowledgeChatCommands.length
      ];

    if (!skill) {
      return false;
    }

    selectSkillMention(skill);
    return true;
  }, [
    activeKnowledgeCommandIndex,
    isKnowledgeCommandPickerOpen,
    knowledgeCommandCount,
    visibleKnowledgeChatCommands,
    visibleSlashSkillOptions,
  ]);

  function onComposerTextareaKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.nativeEvent.isComposing) return;

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
    if (!canSubmit) return;
    void composer.form.handleSubmit(composer.onSubmit)();
    if (composer.textareaRef.current) {
      composer.textareaRef.current.style.height = "auto";
    }
  }

  const openRouterControls = props.showOpenRouterControls ? (
    <OpenRouterControls
      favoriteModelIds={props.openRouterFavoriteModelIds}
      isUpdatingFavorites={props.isOpenRouterModelFavoritesUpdating}
      isLoadingModels={props.isOpenRouterModelsLoading}
      language={props.language}
      modelGroups={props.openRouterModelGroups}
      onFavoriteToggle={props.onOpenRouterModelFavoriteToggle}
      selectedModelId={props.openRouterModelId}
      selectedModelLabel={props.openRouterModelLabel}
      selectedReasoning={props.openRouterReasoning}
      selectedReasoningLabel={props.openRouterReasoningLabel}
      reasoningOptions={props.openRouterReasoningOptions}
      showReasoningControl={props.canSelectOpenRouterReasoning}
      onModelChange={props.onOpenRouterModelChange}
      onReasoningChange={props.onOpenRouterReasoningChange}
    />
  ) : null;

  return (
    <Form {...composer.form}>
      <form
        className="max-h-[75%] min-w-0 shrink-0 overflow-y-auto border-t border-border p-4"
        onSubmit={composer.form.handleSubmit(composer.onSubmit)}
      >
        {isKnowledgeCommandPickerOpen ? (
          <KnowledgeCommandPicker
            activeIndex={activeKnowledgeCommandIndex}
            commands={visibleKnowledgeChatCommands}
            language={props.language}
            onSelect={(command) => {
              selectKnowledgeCommand(command.insertValue || command.value);
            }}
            onSkillSelect={selectSkillMention}
            skills={visibleSlashSkillOptions}
          />
        ) : null}
        {isSkillMentionPickerOpen ? (
          <SkillMentionPicker
            activeIndex={activeSkillMentionOptionIndex}
            isLoading={props.isSkillOptionsLoading}
            knowledgeOption={visibleKnowledgeMentionOption}
            language={props.language}
            skills={[]}
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
            const newlySelectedFiles = event.target.files
              ? Array.from(event.target.files)
              : [];
            for (const file of newlySelectedFiles) {
              if (!fileIds.current.has(file)) {
                fileSequence.current += 1;
                fileIds.current.set(file, `local-file-${fileSequence.current}`);
              }
            }
            const currentFiles = composer.form.getValues("files");
            const files =
              Array.isArray(currentFiles) && isFileArray(currentFiles)
                ? [...currentFiles, ...newlySelectedFiles]
                : newlySelectedFiles;

            composer.form.setValue("files", files.length ? files : undefined, {
              shouldDirty: true,
              shouldValidate: true,
            });

            event.currentTarget.value = "";
          }}
        />
        <div className="min-w-0 rounded-2xl border border-border p-3">
          <SelectedComposerPills
            files={selectedFileItems}
            isKnowledgeSearchSelected={isKnowledgeSearchSelected}
            skills={props.selectedSkills}
            language={props.language}
            onRemoveKnowledgeSearch={removeKnowledgeMention}
            onRemoveFile={removeSelectedFile}
            onReorderFile={reorderSelectedFile}
            onRemoveSkill={removeSelectedSkill}
          />
          <Controller
            name="description"
            control={composer.form.control}
            render={({ field }) => (
              <textarea
                {...field}
                ref={(element) => {
                  field.ref(element);
                  composer.textareaRef.current = element;
                }}
                aria-label={ru ? "Сообщение" : "Message"}
                placeholder={ru ? "Напишите сообщение…" : "Write a message..."}
                rows={4}
                className="h-32 min-h-24 max-h-[min(50dvh,480px)] w-full resize-y rounded-lg bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onChange={(event) => {
                  field.onChange(event);
                  event.currentTarget.style.height = "auto";
                  event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                }}
                onKeyDown={onComposerTextareaKeyDown}
              />
            )}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={() => composer.fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" aria-hidden="true" />
              {ru ? "Прикрепить файлы" : "Attach files"}
            </button>
            <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
              {openRouterControls}
              <button
                type="submit"
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                disabled={!canSubmit}
                aria-label={ru ? "Отправить сообщение" : "Send message"}
              >
                <Send className="size-4" aria-hidden="true" />
                {composer.createMessage.isPending
                  ? ru
                    ? "Отправляем…"
                    : "Sending…"
                  : ru
                    ? "Отправить"
                    : "Send"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ru
              ? "Enter — отправить. Shift + Enter — новая строка."
              : "Enter to send. Shift + Enter for a new line."}
          </p>
        </div>
      </form>
    </Form>
  );
}
