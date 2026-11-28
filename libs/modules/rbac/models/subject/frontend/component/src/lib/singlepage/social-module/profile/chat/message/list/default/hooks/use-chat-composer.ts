"use client";

import { ChatMessageFormValues, chatMessageFormSchema } from "../schemas";
import { OpenRouterReasoningValue, SocialSkill } from "../types";
import { hasKnowledgeMention } from "../utils";
import { ThreadMessagesCache } from "./use-thread-messages-refetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { RBAC_AI_REACTION_REQUEST_METADATA_KEY } from "@sps/rbac/models/subject/sdk/model";
import { PROVIDER_MODEL_SELECTION_METADATA_KEY } from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";

interface UseChatComposerProps {
  isEmployeeChat?: boolean;
  onEmployeeMessageSaved?: () => void;
  isCustomerWork: boolean;
  clearSelectedSkills: () => void;
  markShouldScrollToBottom: () => void;
  modelId: string;
  reasoning: OpenRouterReasoningValue;
  persistAiReactionRequest: boolean;
  profileSkills: SocialSkill[];
  selectedSkillIds: string[];
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
  threadMessagesCache?: ThreadMessagesCache;
}

export function useChatComposer(props: UseChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSend = useRef<
    | {
        threadId: string;
        text: string;
        files: ChatMessageFormValues["files"];
        modelId: string;
        reasoning: OpenRouterReasoningValue;
        id: string;
      }
    | undefined
  >(undefined);
  const form = useForm<ChatMessageFormValues>({
    resolver: zodResolver(chatMessageFormSchema),
    defaultValues: {
      description: "",
    },
  });
  const socialCreateMessage =
    api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleThreadId: props.socialModuleThreadId,
    });
  const focusComposerTextArea = useCallback(() => {
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    });
  }, []);

  async function onSubmit(data: ChatMessageFormValues) {
    props.markShouldScrollToBottom();
    const appliedSkillIds = [...props.selectedSkillIds];
    const isKnowledgeSearchSelected =
      !props.isCustomerWork && hasKnowledgeMention(data.description);
    const messageMetadata = {
      ...(props.isCustomerWork || props.isEmployeeChat
        ? {
            [PROVIDER_MODEL_SELECTION_METADATA_KEY]: {
              modelId: props.modelId,
              ...(props.reasoning !== "auto" && { reasoning: props.reasoning }),
            },
          }
        : {}),
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
      ...(props.persistAiReactionRequest
        ? {
            [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
              version: 1,
              modelId: props.modelId,
              reasoning: props.reasoning,
              skillIds: appliedSkillIds,
              useKnowledgeSearch: isKnowledgeSearchSelected,
            },
          }
        : {}),
    };
    const hasMessageMetadata = Object.keys(messageMetadata).length > 0;

    if (socialCreateMessage.isPending) return;
    const deduplicate = props.isCustomerWork || props.isEmployeeChat;
    if (
      deduplicate &&
      (lastSend.current?.threadId !== props.socialModuleThreadId ||
        lastSend.current.text !== data.description ||
        lastSend.current.modelId !== props.modelId ||
        lastSend.current.reasoning !== props.reasoning ||
        lastSend.current.files?.length !== data.files?.length ||
        data.files?.some(
          (file, index) => file !== lastSend.current?.files?.[index],
        ))
    ) {
      lastSend.current = {
        threadId: props.socialModuleThreadId,
        text: data.description,
        files: data.files,
        modelId: props.modelId,
        reasoning: props.reasoning,
        id: crypto.randomUUID(),
      };
    }

    socialCreateMessage.mutate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          description: data.description,
          ...(deduplicate && lastSend.current
            ? { sourceSystemId: lastSend.current.id }
            : {}),
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
          // Targeted append (exact server response) instead of a full
          // invalidation - the timeline gains one row without refetching.
          // WS topic invalidation remains the background consistency check.
          if (createdMessage?.id) {
            props.threadMessagesCache?.append(createdMessage);
          } else {
            props.threadMessagesCache?.refetch();
          }
          props.onEmployeeMessageSaved?.();
          lastSend.current = undefined;
          resetComposer();
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
    createMessage: socialCreateMessage,
    fileInputRef,
    focusComposerTextArea,
    form,
    onSubmit,
    resetComposer,
    textareaRef,
  };
}
