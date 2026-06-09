"use client";

import { ChatMessageFormValues, chatMessageFormSchema } from "../schemas";
import { OpenRouterReasoningValue, SocialSkill } from "../types";
import { hasKnowledgeMention } from "../utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface UseChatComposerProps {
  assistantProfileId?: string;
  clearSelectedSkills: () => void;
  isKnowledgeChat: boolean;
  markShouldScrollToBottom: () => void;
  onKnowledgeReactionSuccess: () => void;
  openRouterModelId: string;
  openRouterReasoning: OpenRouterReasoningValue;
  profileSkills: SocialSkill[];
  refetchThreadMessages: () => void;
  selectedSkillIds: string[];
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

export function useChatComposer(props: UseChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const form = useForm<ChatMessageFormValues>({
    resolver: zodResolver(chatMessageFormSchema),
    defaultValues: {
      description: "",
    },
  });
  const createMessage =
    api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleThreadId: props.socialModuleThreadId,
    });
  const reactByOpenrouter =
    api.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleMessageId: "pending",
      },
    );

  const selectedFiles = form.watch("files");
  const description = form.watch("description");
  const selectedFileNames = Array.isArray(selectedFiles)
    ? selectedFiles.map((file) => {
        return typeof file === "string" ? file : file.name;
      })
    : [];
  const canSubmit = Boolean(description?.trim()) && !createMessage.isPending;

  const focusComposerTextArea = useCallback(() => {
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, []);

  async function onSubmit(data: ChatMessageFormValues) {
    props.markShouldScrollToBottom();
    const appliedSkillIds = [...props.selectedSkillIds];
    const isKnowledgeSearchSelected = hasKnowledgeMention(data.description);
    const messageMetadata = {
      ...(appliedSkillIds.length
        ? {
            socialSkillMentions: appliedSkillIds.map((skillId) => {
              const skill = props.profileSkills.find((item) => {
                return item.id === skillId;
              });

              return {
                skillId,
                slug: skill?.slug || null,
              };
            }),
          }
        : {}),
      ...(isKnowledgeSearchSelected
        ? {
            knowledgeMention: {
              slug: "knowledge",
              useKnowledgeSearch: true,
            },
          }
        : {}),
    };
    const hasMessageMetadata = Object.keys(messageMetadata).length > 0;

    createMessage.mutate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          description: data.description,
          files: data.files,
          ...(hasMessageMetadata
            ? {
                metadata: messageMetadata,
              }
            : {}),
        },
      },
      {
        onSuccess(createdMessage) {
          if (
            !props.isKnowledgeChat ||
            !props.assistantProfileId ||
            !createdMessage.id
          ) {
            return;
          }

          reactByOpenrouter.mutate(
            {
              id: props.subjectId,
              socialModuleProfileId: props.socialModuleProfileId,
              socialModuleChatId: props.socialModuleChatId,
              socialModuleMessageId: createdMessage.id,
              params: {
                model: props.openRouterModelId || "auto",
                reasoning: props.openRouterReasoning || "auto",
              },
              data: {
                shouldReplySocialModuleProfile: {
                  id: props.assistantProfileId,
                },
                ...(appliedSkillIds.length
                  ? {
                      skillIds: appliedSkillIds,
                    }
                  : {}),
                ...(isKnowledgeSearchSelected
                  ? {
                      useKnowledgeSearch: true,
                    }
                  : {}),
              },
            },
            {
              onSuccess() {
                props.refetchThreadMessages();
                props.onKnowledgeReactionSuccess();
              },
              onError(error: unknown) {
                props.refetchThreadMessages();
                toast.error(
                  getErrorMessage(error, "OpenRouter response failed"),
                );
              },
            },
          );
        },
        onError(error: unknown) {
          toast.error(getErrorMessage(error, "Message creation failed"));
        },
      },
    );
  }

  function resetComposer() {
    form.reset({
      description: "",
      files: undefined,
    });
    props.clearSelectedSkills();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!createMessage.isSuccess) {
      return;
    }

    toast.success("Message created successfully");
    props.refetchThreadMessages();
    resetComposer();
  }, [createMessage.isSuccess]);

  return {
    canSubmit,
    createMessage,
    description,
    fileInputRef,
    focusComposerTextArea,
    form,
    onSubmit,
    reactByOpenrouter,
    resetComposer,
    selectedFileNames,
    textareaRef,
  };
}
