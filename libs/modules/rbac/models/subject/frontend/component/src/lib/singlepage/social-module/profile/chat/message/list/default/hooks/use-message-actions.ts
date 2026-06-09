"use client";

import { MessageEditFormValues, messageEditFormSchema } from "../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface UseMessageActionsProps {
  refetchThreadMessages: () => void;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
}

export function useMessageActions(props: UseMessageActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
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

    updateMessage.mutate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleMessageId: editingMessageId,
      data: {
        description: data.description,
      },
    });
  }

  function onMessageRowEdit(messageToEdit: ISocialModuleMessage) {
    setEditingMessageId(messageToEdit.id);
    messageEditForm.reset({
      description: messageToEdit.description || "",
    });
    setIsEditOpen(true);
  }

  function onMessageRowDelete(messageToDelete: ISocialModuleMessage) {
    deleteMessage.mutate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      socialModuleMessageId: messageToDelete.id,
    });
  }

  useEffect(() => {
    if (!updateMessage.isSuccess) {
      return;
    }

    toast.success("Message updated successfully");
    props.refetchThreadMessages();
    setIsEditOpen(false);
    setEditingMessageId(null);
  }, [updateMessage.isSuccess]);

  useEffect(() => {
    if (!deleteMessage.isSuccess) {
      return;
    }

    props.refetchThreadMessages();
  }, [deleteMessage.isSuccess]);

  return {
    deleteMessage,
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
