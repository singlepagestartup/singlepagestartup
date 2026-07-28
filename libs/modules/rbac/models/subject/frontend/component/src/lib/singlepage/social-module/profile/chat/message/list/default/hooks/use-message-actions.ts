"use client";

import { MessageEditFormValues, messageEditFormSchema } from "../schemas";
import { ThreadMessagesCache } from "./use-thread-messages-refetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface UseMessageActionsProps {
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
  threadMessagesCache: ThreadMessagesCache;
}

export function useMessageActions(props: UseMessageActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const messageEditForm = useForm<MessageEditFormValues>({
    resolver: zodResolver(messageEditFormSchema),
    defaultValues: {
      description: "",
    },
  });
  const updateMessage =
    api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleMessageId: editingMessageId || "unknown",
    });
  const deleteMessage =
    api.socialModuleProfileFindByIdChatFindByIdMessageDelete({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleMessageId: "unknown",
    });

  async function onMessageEditSubmit(data: MessageEditFormValues) {
    if (!editingMessageId) {
      return;
    }

    const updatedMessageId = editingMessageId;

    updateMessage.mutate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleMessageId: updatedMessageId,
        data: {
          description: data.description,
        },
      },
      {
        onSuccess(updateResult) {
          toast.success("Message updated successfully");

          // The update SDK returns ISocialModuleMessage[] - select the edited
          // message and patch only that row; fall back to a full refetch when
          // the response shape does not contain it.
          const updatedMessage = Array.isArray(updateResult)
            ? updateResult.find((message) => message.id === updatedMessageId)
            : updateResult;

          if (updatedMessage?.id) {
            props.threadMessagesCache.patch(updatedMessage.id, updatedMessage);
          } else {
            props.threadMessagesCache.refetch();
          }

          setIsEditOpen(false);
          setEditingMessageId(null);
        },
        onError() {
          // Restore server truth - the cache may hold an optimistic state.
          props.threadMessagesCache.refetch();
        },
      },
    );
  }

  // Stable references: these handlers are passed to every memoized timeline
  // row; an unstable identity would defeat React.memo on all rows.
  const onMessageRowEdit = useCallback(
    (messageToEdit: ISocialModuleMessage) => {
      setEditingMessageId(messageToEdit.id);
      messageEditForm.reset({
        description: messageToEdit.description || "",
      });
      setIsEditOpen(true);
    },
    [messageEditForm],
  );

  const onMessageRowDelete = useCallback(
    (messageToDelete: ISocialModuleMessage) => {
      setDeletingMessageId(messageToDelete.id);
      deleteMessage.mutate(
        {
          id: props.subjectId,
          socialModuleProfileId: props.socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleMessageId: messageToDelete.id,
        },
        {
          onSuccess() {
            // Targeted removal - only this row disappears; no full refetch.
            props.threadMessagesCache.remove(messageToDelete.id);
            setDeletingMessageId(null);
          },
          onError() {
            // Restore server truth.
            props.threadMessagesCache.refetch();
            setDeletingMessageId(null);
          },
        },
      );
    },
    [
      deleteMessage.mutate,
      props.socialModuleChatId,
      props.socialModuleProfileId,
      props.subjectId,
      props.threadMessagesCache,
    ],
  );

  return {
    deleteMessage,
    deletingMessageId,
    editingMessageId,
    isEditOpen,
    messageEditForm,
    onMessageEditSubmit,
    onMessageRowDelete,
    onMessageRowEdit,
    setEditingMessageId,
    setIsEditOpen,
    updateMessage,
  };
}
