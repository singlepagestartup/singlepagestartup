"use client";

import { ChatMessageFormValues, chatMessageFormSchema } from "../schemas";
import { OpenRouterReasoningValue, SocialSkill } from "../types";
import { hasKnowledgeMention } from "../utils";
import { ThreadMessagesCache } from "./use-thread-messages-refetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface UseChatComposerProps {
  assistantProfileId?: string;
  clearSelectedSkills: () => void;
  markShouldScrollToBottom: () => void;
  onKnowledgeReactionSuccess: () => void;
  openRouterModelId: string;
  openRouterReasoning: OpenRouterReasoningValue;
  profileSkills: SocialSkill[];
  selectedSkillIds: string[];
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
  threadMessagesCache: ThreadMessagesCache;
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
          toast.success("Message created successfully");
          // Targeted append (exact server response) instead of a full
          // invalidation - the timeline gains one row without refetching.
          // WS topic invalidation remains the background consistency check.
          if (createdMessage?.id) {
            props.threadMessagesCache.append(createdMessage);
          } else {
            props.threadMessagesCache.refetch();
          }
          resetComposer();

          if (!props.assistantProfileId || !createdMessage?.id) {
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
                // The AI reply is created server-side - the client cannot
                // predict it, so a full refetch is the correct sync here.
                props.threadMessagesCache.refetch();
                props.onKnowledgeReactionSuccess();
              },
              onError(error: unknown) {
                props.threadMessagesCache.refetch();
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

  return {
    createMessage,
    fileInputRef,
    focusComposerTextArea,
    form,
    onSubmit,
    reactByOpenrouter,
    resetComposer,
    textareaRef,
  };
}
