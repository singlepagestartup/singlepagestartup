"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as SocialModuleProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Form,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CollapsibleTrigger,
  CollapsibleContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import MDEditor from "@uiw/react-md-editor";
import {
  BookOpenCheck,
  BookOpenText,
  DatabaseZap,
  FileText,
  MoreHorizontal,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Save,
  Send,
  Smile,
} from "lucide-react";

const formSchema = z.object({
  description: z.string().min(1),
  files: z
    .custom<File[]>(
      (v) => Array.isArray(v) && v.every((item) => item instanceof File),
    )
    .or(z.string().array())
    .optional(),
});
const messageEditFormSchema = z.object({
  description: z.string().min(1),
});
const scrollBottomThreshold = 120;
const knowledgeChatCommands = [
  {
    value: "/learn",
    title: "Learn",
    description:
      "Add this message and text or markdown attachments to this AI profile knowledge base.",
  },
];

interface ProfileSummary {
  id: string;
  slug: string;
  href: string;
  initial: string;
}

function formatTimelineDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKnowledgeDate(value?: string | Date | null) {
  if (!value) {
    return "Not indexed";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not indexed";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFallbackProfile(label = "Unknown profile"): ProfileSummary {
  return {
    id: "unknown",
    slug: label,
    href: "#",
    initial: label.charAt(0).toUpperCase(),
  };
}

function getFallbackSocialModuleProfile(
  label = "Unknown profile",
): ISocialModuleProfile {
  return {
    id: "unknown",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    className: null,
    variant: "default",
    title: {},
    subtitle: {},
    description: {},
    adminTitle: label,
    slug: label,
  };
}

function getProfileSummary(
  profile: { id: string; slug: string },
  language: string,
) {
  const href = saveLanguageContext(
    `/social/profiles/${profile.slug}`,
    language,
    internationalization.languages,
  );

  return {
    id: profile.id,
    slug: profile.slug,
    href,
    initial: profile.slug.charAt(0).toUpperCase() || "?",
  };
}

function getTimelineSignature(
  socialModuleThreadId: string,
  items: IComponentPropsExtended["socialModuleMessagesAndActionsQuery"] = [],
) {
  const lastItem = items[items.length - 1];

  return [
    socialModuleThreadId,
    items.length,
    lastItem?.type || "",
    lastItem?.data.id || "",
    lastItem?.data.updatedAt || "",
    lastItem?.data.createdAt || "",
  ].join(":");
}

function MessageProfile(props: {
  messageId: string;
  language: string;
  children: (profile: ISocialModuleProfile) => ReactNode;
}) {
  return (
    <SocialModuleProfilesToMessages
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.messageId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToMessages }) => {
        const socialModuleProfilesToMessage =
          socialModuleProfilesToMessages?.[0];

        if (!socialModuleProfilesToMessage) {
          return props.children(getFallbackSocialModuleProfile());
        }

        return (
          <SocialModuleProfile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: socialModuleProfilesToMessage.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackSocialModuleProfile());
              }

              return props.children(socialModuleProfile);
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToMessages>
  );
}

function ActionProfile(props: {
  actionId: string;
  language: string;
  children: (profile: ProfileSummary) => ReactNode;
}) {
  return (
    <SocialModuleProfilesToActions
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "actionId",
                method: "eq",
                value: props.actionId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToActions }) => {
        const socialModuleProfilesToAction = socialModuleProfilesToActions?.[0];

        if (!socialModuleProfilesToAction) {
          return props.children(getFallbackProfile("System"));
        }

        return (
          <SocialModuleProfile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: socialModuleProfilesToAction.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackProfile("System"));
              }

              return props.children(
                getProfileSummary(socialModuleProfile, props.language),
              );
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToActions>
  );
}

export function Component(props: IComponentPropsExtended) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const shouldKeepMessagesPinnedToBottomRef = useRef(true);
  const shouldScrollToBottomOnNextRenderRef = useRef(true);
  const shouldUseInstantScrollToBottomRef = useRef(true);
  const lastSocialModuleThreadIdRef = useRef<string | null>(null);
  const socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate =
    api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: props.socialModuleThreadId,
    });
  const socialModuleProfileFindByIdChatFindByIdMessageDelete =
    api.socialModuleProfileFindByIdChatFindByIdMessageDelete({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: "unknown",
    });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isKnowledgeSidebarOpen, setIsKnowledgeSidebarOpen] = useState(true);
  const [isKnowledgeMobileSheetOpen, setIsKnowledgeMobileSheetOpen] =
    useState(false);
  const [selectedKnowledgeDocumentId, setSelectedKnowledgeDocumentId] =
    useState<string | null>(null);
  const [knowledgeDocumentDraft, setKnowledgeDocumentDraft] = useState({
    title: "",
    description: "",
  });
  const [
    knowledgeDocumentsNeedingReindex,
    setKnowledgeDocumentsNeedingReindex,
  ] = useState<Record<string, boolean>>({});
  const [reindexingKnowledgeDocumentId, setReindexingKnowledgeDocumentId] =
    useState<string | null>(null);
  const socialModuleProfileFindByIdChatFindByIdMessageUpdate =
    api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: editingMessageId || "unknown",
    });
  const socialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge =
    api.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByKnowledge({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: "pending",
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });
  const messageEditForm = useForm<z.infer<typeof messageEditFormSchema>>({
    resolver: zodResolver(messageEditFormSchema),
    defaultValues: {
      description: "",
    },
  });
  const selectedFiles = form.watch("files");
  const selectedFileNames = Array.isArray(selectedFiles)
    ? selectedFiles.map((file) => {
        return typeof file === "string" ? file : file.name;
      })
    : [];
  const description = form.watch("description");
  const isKnowledgeChat = props.socialModuleChat.variant === "knowledge";
  const knowledgeAssistantProfileId = isKnowledgeChat
    ? props.knowledgeAssistantProfile?.id
    : undefined;
  const knowledgeDocumentScopeParams = useMemo(() => {
    if (!knowledgeAssistantProfileId) {
      return undefined;
    }

    return {
      targetSocialModuleProfileId: knowledgeAssistantProfileId,
      socialModuleChatId: props.socialModuleChat.id,
    };
  }, [knowledgeAssistantProfileId, props.socialModuleChat.id]);
  const {
    data: knowledgeDocumentsQuery,
    isLoading: knowledgeDocumentsLoading,
    refetch: refetchKnowledgeDocuments,
  } = api.socialModuleProfileFindByIdKnowledgeDocumentFind({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    params: knowledgeDocumentScopeParams,
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
    reactQueryOptions: {
      enabled: Boolean(knowledgeAssistantProfileId),
    },
  });
  const knowledgeDocuments = useMemo(() => {
    return knowledgeDocumentsQuery || [];
  }, [knowledgeDocumentsQuery]);
  const selectedKnowledgeDocument = useMemo(() => {
    return knowledgeDocuments.find((document) => {
      return document.id === selectedKnowledgeDocumentId;
    });
  }, [knowledgeDocuments, selectedKnowledgeDocumentId]);
  const isKnowledgeDocumentDirty = Boolean(
    selectedKnowledgeDocument &&
      (knowledgeDocumentDraft.title !== selectedKnowledgeDocument.title ||
        knowledgeDocumentDraft.description !==
          selectedKnowledgeDocument.description),
  );
  const selectedKnowledgeDocumentNeedsReindex = Boolean(
    selectedKnowledgeDocument &&
      knowledgeDocumentsNeedingReindex[selectedKnowledgeDocument.id],
  );
  const knowledgeDocumentUpdate =
    api.socialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      knowledgeModuleDocumentId:
        selectedKnowledgeDocumentId || "missing-document",
    });
  const knowledgeDocumentReindex =
    api.socialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      knowledgeModuleDocumentId:
        selectedKnowledgeDocumentId || "missing-document",
    });
  const commandQuery = description?.trimStart() || "";
  const visibleKnowledgeChatCommands = useMemo(() => {
    if (!isKnowledgeChat || !commandQuery.startsWith("/")) {
      return [];
    }

    const normalizedQuery = commandQuery.toLowerCase();

    return knowledgeChatCommands.filter((command) => {
      return (
        command.value.includes(normalizedQuery) ||
        command.title.toLowerCase().includes(normalizedQuery.replace("/", ""))
      );
    });
  }, [commandQuery, isKnowledgeChat]);
  const isKnowledgeCommandPickerOpen =
    isKnowledgeChat &&
    commandQuery.startsWith("/") &&
    !commandQuery.includes(" ") &&
    !commandQuery.includes("\n");
  const canSubmit =
    Boolean(description?.trim()) &&
    !socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isPending;
  const threadMessagesQueryKey = useMemo(() => {
    return [
      `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/chats/${props.socialModuleChat.id}/threads/${props.socialModuleThreadId}/messages`,
    ];
  }, [
    props.data.id,
    props.socialModuleChat.id,
    props.socialModuleProfile.id,
    props.socialModuleThreadId,
  ]);
  const timelineSignature = useMemo(() => {
    return getTimelineSignature(
      props.socialModuleThreadId,
      props.socialModuleMessagesAndActionsQuery,
    );
  }, [props.socialModuleMessagesAndActionsQuery, props.socialModuleThreadId]);
  const timelineItemCount =
    props.socialModuleMessagesAndActionsQuery?.length ?? 0;
  const updateIsAtBottom = useCallback(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      isAtBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;

      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isAtBottom = distanceFromBottom <= scrollBottomThreshold;

    isAtBottomRef.current = isAtBottom;
    shouldKeepMessagesPinnedToBottomRef.current = isAtBottom;
  }, []);
  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      let nestedFrameId: number | undefined;

      const scroll = () => {
        const viewport = messagesViewportRef.current;

        if (!viewport) {
          return;
        }

        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });

        isAtBottomRef.current = true;
        shouldKeepMessagesPinnedToBottomRef.current = true;
      };

      scroll();

      const frameId = window.requestAnimationFrame(() => {
        scroll();
        nestedFrameId = window.requestAnimationFrame(scroll);
      });

      const settleTimeoutId = window.setTimeout(scroll, 80);
      const finalTimeoutId = window.setTimeout(scroll, 240);

      return () => {
        window.cancelAnimationFrame(frameId);

        if (nestedFrameId) {
          window.cancelAnimationFrame(nestedFrameId);
        }

        window.clearTimeout(settleTimeoutId);
        window.clearTimeout(finalTimeoutId);
      };
    },
    [],
  );
  const refetchThreadMessages = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: threadMessagesQueryKey,
    });
  }, [threadMessagesQueryKey]);
  const knowledgeDocumentsQueryKey = useMemo(() => {
    const scope = knowledgeDocumentScopeParams
      ? `?targetSocialModuleProfileId=${knowledgeDocumentScopeParams.targetSocialModuleProfileId}&socialModuleChatId=${knowledgeDocumentScopeParams.socialModuleChatId}`
      : "";

    return [
      `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/knowledge/documents${scope}`,
    ];
  }, [
    knowledgeDocumentScopeParams,
    props.data.id,
    props.socialModuleProfile.id,
  ]);
  const refetchKnowledgeDocumentQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: knowledgeDocumentsQueryKey,
    });
    void refetchKnowledgeDocuments();
  }, [knowledgeDocumentsQueryKey, refetchKnowledgeDocuments]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    shouldScrollToBottomOnNextRenderRef.current = true;
    shouldKeepMessagesPinnedToBottomRef.current = true;

    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.mutate(
      {
        id: props.data.id,
        socialModuleProfileId: props.socialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          description: data.description,
          files: data.files,
        },
      },
      {
        onSuccess(createdMessage) {
          const assistantProfileId = props.knowledgeAssistantProfile?.id;

          if (!isKnowledgeChat || !assistantProfileId || !createdMessage.id) {
            return;
          }

          socialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge.mutate(
            {
              id: props.data.id,
              socialModuleProfileId: props.socialModuleProfile.id,
              socialModuleChatId: props.socialModuleChat.id,
              socialModuleMessageId: createdMessage.id,
              data: {
                shouldReplySocialModuleProfile: {
                  id: assistantProfileId,
                },
              },
            },
            {
              onSuccess() {
                refetchThreadMessages();
                refetchKnowledgeDocumentQueries();
              },
            },
          );
        },
      },
    );
  }

  function selectKnowledgeCommand(commandValue: string) {
    form.setValue("description", `${commandValue} `, {
      shouldDirty: true,
      shouldValidate: true,
    });

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
  }

  async function onMessageEditSubmit(
    data: z.infer<typeof messageEditFormSchema>,
  ) {
    if (!editingMessageId) {
      return;
    }

    socialModuleProfileFindByIdChatFindByIdMessageUpdate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
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
    socialModuleProfileFindByIdChatFindByIdMessageDelete.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: messageToDelete.id,
    });
  }

  function onKnowledgeDocumentSave() {
    if (!selectedKnowledgeDocument || !knowledgeAssistantProfileId) {
      return;
    }

    const title =
      knowledgeDocumentDraft.title.trim() || selectedKnowledgeDocument.title;

    knowledgeDocumentUpdate.mutate(
      {
        id: props.data.id,
        socialModuleProfileId: props.socialModuleProfile.id,
        knowledgeModuleDocumentId: selectedKnowledgeDocument.id,
        params: knowledgeDocumentScopeParams,
        data: {
          title,
          description: knowledgeDocumentDraft.description,
        },
      },
      {
        onSuccess(updatedDocument) {
          toast.success("Knowledge document saved");
          setKnowledgeDocumentsNeedingReindex((current) => {
            return {
              ...current,
              [updatedDocument.id]: true,
            };
          });
          setKnowledgeDocumentDraft({
            title: updatedDocument.title,
            description: updatedDocument.description,
          });
          refetchKnowledgeDocumentQueries();
        },
      },
    );
  }

  async function onKnowledgeDocumentReindex() {
    if (!selectedKnowledgeDocument || !knowledgeAssistantProfileId) {
      return;
    }

    setReindexingKnowledgeDocumentId(selectedKnowledgeDocument.id);

    try {
      await knowledgeDocumentReindex.mutateAsync({
        id: props.data.id,
        socialModuleProfileId: props.socialModuleProfile.id,
        knowledgeModuleDocumentId: selectedKnowledgeDocument.id,
        params: knowledgeDocumentScopeParams,
      });
      toast.success("Knowledge document reindexed");
      setKnowledgeDocumentsNeedingReindex((current) => {
        const next = { ...current };
        delete next[selectedKnowledgeDocument.id];
        return next;
      });
      refetchKnowledgeDocumentQueries();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reindex Knowledge document");
    } finally {
      setReindexingKnowledgeDocumentId(null);
    }
  }

  useEffect(() => {
    if (!isKnowledgeChat) {
      setSelectedKnowledgeDocumentId(null);
      return;
    }

    if (!knowledgeDocuments.length) {
      setSelectedKnowledgeDocumentId(null);
      return;
    }

    const selectedDocumentExists = knowledgeDocuments.some((document) => {
      return document.id === selectedKnowledgeDocumentId;
    });

    if (!selectedDocumentExists) {
      setSelectedKnowledgeDocumentId(knowledgeDocuments[0].id);
    }
  }, [isKnowledgeChat, knowledgeDocuments, selectedKnowledgeDocumentId]);

  useEffect(() => {
    if (!selectedKnowledgeDocument) {
      setKnowledgeDocumentDraft({
        title: "",
        description: "",
      });
      return;
    }

    setKnowledgeDocumentDraft({
      title: selectedKnowledgeDocument.title,
      description: selectedKnowledgeDocument.description,
    });
  }, [
    selectedKnowledgeDocument?.description,
    selectedKnowledgeDocument?.id,
    selectedKnowledgeDocument?.title,
  ]);

  useEffect(() => {
    if (
      !socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isSuccess
    ) {
      return;
    }

    toast.success("Message created successfully");
    refetchThreadMessages();
    form.reset({
      description: "",
      files: undefined,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [
    form,
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isSuccess,
  ]);

  useEffect(() => {
    if (!socialModuleProfileFindByIdChatFindByIdMessageUpdate.isSuccess) {
      return;
    }

    toast.success("Message updated successfully");
    refetchThreadMessages();
    setIsEditOpen(false);
    setEditingMessageId(null);
  }, [
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdMessageUpdate.isSuccess,
  ]);

  useEffect(() => {
    if (!socialModuleProfileFindByIdChatFindByIdMessageDelete.isSuccess) {
      return;
    }

    refetchThreadMessages();
  }, [
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdMessageDelete.isSuccess,
  ]);

  useLayoutEffect(() => {
    const threadChanged =
      lastSocialModuleThreadIdRef.current !== props.socialModuleThreadId;

    if (threadChanged) {
      shouldUseInstantScrollToBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;
    }

    const hasTimelineItems = timelineItemCount > 0;
    const shouldScrollToBottom =
      threadChanged ||
      shouldScrollToBottomOnNextRenderRef.current ||
      isAtBottomRef.current;

    lastSocialModuleThreadIdRef.current = props.socialModuleThreadId;
    shouldScrollToBottomOnNextRenderRef.current = false;

    if (shouldScrollToBottom) {
      const cleanup = scrollMessagesToBottom(
        shouldUseInstantScrollToBottomRef.current ? "auto" : "smooth",
      );

      if (hasTimelineItems) {
        shouldUseInstantScrollToBottomRef.current = false;
      }

      return cleanup;
    }

    if (hasTimelineItems) {
      shouldUseInstantScrollToBottomRef.current = false;
    }

    return undefined;
  }, [
    props.socialModuleThreadId,
    scrollMessagesToBottom,
    timelineItemCount,
    timelineSignature,
  ]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const viewport = messagesViewportRef.current;
    const content = messagesContentRef.current;

    if (!viewport && !content) {
      return undefined;
    }

    let resizeFrameId: number | undefined;
    let scrollCleanup: (() => void) | undefined;

    const keepPinnedToBottom = () => {
      if (!shouldKeepMessagesPinnedToBottomRef.current) {
        return;
      }

      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        scrollCleanup?.();
        scrollCleanup = scrollMessagesToBottom("auto");
      });
    };

    const observer = new ResizeObserver(keepPinnedToBottom);

    if (viewport) {
      observer.observe(viewport);
    }

    if (content) {
      observer.observe(content);
    }

    window.addEventListener("resize", keepPinnedToBottom);

    return () => {
      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      scrollCleanup?.();
      observer.disconnect();
      window.removeEventListener("resize", keepPinnedToBottom);
    };
  }, [props.socialModuleThreadId, scrollMessagesToBottom, timelineItemCount]);

  function renderKnowledgeDocumentsPanel(options?: { mobile?: boolean }) {
    const assistantProfileName =
      props.knowledgeAssistantProfile?.adminTitle ||
      props.knowledgeAssistantProfile?.slug ||
      "No Knowledge assistant";
    const selectedReindexing =
      selectedKnowledgeDocument?.id === reindexingKnowledgeDocumentId;

    return (
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b border-slate-200 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpenText className="h-4 w-4 shrink-0 text-slate-500" />
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  Knowledge
                </h3>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {assistantProfileName}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                {knowledgeDocuments.length}
              </span>
              {!options?.mobile ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsKnowledgeSidebarOpen(false);
                  }}
                  title="Hide Knowledge documents"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <PanelRightClose className="h-4 w-4" />
                  <span className="sr-only">Hide Knowledge documents</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,220px)_minmax(0,1fr)]">
          <ScrollArea className="min-h-0 border-b border-slate-200">
            <div className="space-y-1 p-3">
              {!props.knowledgeAssistantProfile ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                  <DatabaseZap className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-500">
                    No chat-gpt AI profile is connected to this chat.
                  </p>
                </div>
              ) : knowledgeDocumentsLoading ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Loading documents...
                </p>
              ) : knowledgeDocuments.length ? (
                knowledgeDocuments.map((document) => {
                  const isSelected =
                    document.id === selectedKnowledgeDocument?.id;
                  const needsReindex =
                    knowledgeDocumentsNeedingReindex[document.id];

                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => {
                        setSelectedKnowledgeDocumentId(document.id);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition",
                        isSelected
                          ? "border-slate-300 bg-slate-100"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-slate-700">
                          {document.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                          {formatKnowledgeDate(document.lastIndexedAt)}
                        </span>
                      </span>
                      {needsReindex ? (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                          stale
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                  <BookOpenCheck className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-500">
                    No documents are linked to this AI profile.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="min-h-0 overflow-hidden">
            {selectedKnowledgeDocument ? (
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      Title
                    </label>
                    <input
                      value={knowledgeDocumentDraft.title}
                      onChange={(event) => {
                        setKnowledgeDocumentDraft((current) => {
                          return {
                            ...current,
                            title: event.target.value,
                          };
                        });
                      }}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      Content
                    </label>
                    <Textarea
                      value={knowledgeDocumentDraft.description}
                      onChange={(event) => {
                        setKnowledgeDocumentDraft((current) => {
                          return {
                            ...current,
                            description: event.target.value,
                          };
                        });
                      }}
                      rows={12}
                      className="min-h-56 resize-none text-sm"
                    />
                  </div>
                  <dl className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-slate-400">Status</dt>
                      <dd className="mt-0.5 truncate text-slate-600">
                        {selectedKnowledgeDocument.status}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Last indexed</dt>
                      <dd className="mt-0.5 truncate text-slate-600">
                        {formatKnowledgeDate(
                          selectedKnowledgeDocument.lastIndexedAt,
                        )}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Slug</dt>
                      <dd className="mt-0.5 truncate text-slate-600">
                        {selectedKnowledgeDocument.slug}
                      </dd>
                    </div>
                  </dl>
                  {selectedKnowledgeDocumentNeedsReindex ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Saved changes are not indexed yet.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-auto"
                      onClick={onKnowledgeDocumentSave}
                      disabled={
                        !isKnowledgeDocumentDirty ||
                        knowledgeDocumentUpdate.isPending
                      }
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {knowledgeDocumentUpdate.isPending ? "Saving" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-auto"
                      onClick={() => {
                        void onKnowledgeDocumentReindex();
                      }}
                      disabled={Boolean(reindexingKnowledgeDocumentId)}
                    >
                      <RefreshCw
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedReindexing ? "animate-spin" : "",
                        )}
                      />
                      {selectedReindexing ? "Reindexing" : "Reindex"}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center px-4 text-center">
                <FileText className="h-6 w-6 text-slate-300" />
                <p className="mt-2 text-xs text-slate-500">
                  Select a document to view or edit it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-white",
        props.className,
      )}
    >
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={messagesViewportRef}
            onScroll={updateIsAtBottom}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {isKnowledgeChat ? (
              <div className="mx-auto mb-3 flex w-full max-w-4xl justify-end gap-2">
                <Sheet
                  open={isKnowledgeMobileSheetOpen}
                  onOpenChange={setIsKnowledgeMobileSheetOpen}
                >
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
                    >
                      <BookOpenText className="h-4 w-4" />
                      Documents
                    </button>
                  </SheetTrigger>
                  <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Knowledge documents</SheetTitle>
                      <SheetDescription>
                        View, edit, and reindex documents linked to this AI
                        profile.
                      </SheetDescription>
                    </SheetHeader>
                    {renderKnowledgeDocumentsPanel({ mobile: true })}
                  </SheetContent>
                </Sheet>
                <button
                  type="button"
                  onClick={() => {
                    setIsKnowledgeSidebarOpen((current) => !current);
                  }}
                  title={
                    isKnowledgeSidebarOpen
                      ? "Hide Knowledge documents"
                      : "Show Knowledge documents"
                  }
                  className="hidden h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
                >
                  {isKnowledgeSidebarOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                  Documents
                </button>
              </div>
            ) : null}
            {props.socialModuleMessagesAndActionsQuery?.length ? (
              <div
                ref={messagesContentRef}
                className="mx-auto flex w-full max-w-4xl flex-col gap-1"
              >
                {props.socialModuleMessagesAndActionsQuery.map(
                  (socialModuleMessageOrAction, index) => {
                    if (socialModuleMessageOrAction.type === "message") {
                      const message = socialModuleMessageOrAction.data;

                      return (
                        <MessageProfile
                          key={message.id}
                          messageId={message.id}
                          language={props.language}
                        >
                          {(profile) => {
                            return (
                              <SocialModuleProfile
                                isServer={false}
                                variant="chat-message-row"
                                data={profile}
                                language={props.language}
                                message={message}
                                isDeleting={
                                  socialModuleProfileFindByIdChatFindByIdMessageDelete.isPending
                                }
                                onEdit={onMessageRowEdit}
                                onDelete={onMessageRowDelete}
                              />
                            );
                          }}
                        </MessageProfile>
                      );
                    }

                    const action = socialModuleMessageOrAction.data;
                    const createdAt = formatTimelineDate(action.createdAt);

                    return (
                      <ActionProfile
                        key={action.id || index}
                        actionId={action.id}
                        language={props.language}
                      >
                        {(profile) => {
                          return (
                            <Collapsible className="mx-3 my-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70">
                              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
                                <span className="min-w-0 truncate text-xs text-slate-500">
                                  {profile.slug} recorded an action
                                  {createdAt ? ` · ${createdAt}` : ""}
                                </span>
                                <MoreHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <pre className="mx-3 mb-3 max-h-48 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-5 text-slate-500 ring-1 ring-slate-200">
                                  {JSON.stringify(action.payload, null, 2)}
                                </pre>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        }}
                      </ActionProfile>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
                <h3 className="text-sm font-medium text-slate-700">
                  No messages yet
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Send the first message to start this thread.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" aria-hidden="true" />
          </div>
          <Dialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);

              if (!open) {
                setEditingMessageId(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Message</DialogTitle>
                <DialogDescription>
                  Update the message text and save changes.
                </DialogDescription>
              </DialogHeader>
              <Form {...messageEditForm}>
                <div className="grid w-full gap-4">
                  <div
                    className="flex w-full flex-col gap-2"
                    data-color-mode="light"
                  >
                    <label className="text-sm font-medium">Text</label>
                    <Controller
                      name="description"
                      control={messageEditForm.control}
                      render={({ field }) => {
                        return (
                          <MDEditor
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value ?? "");
                            }}
                            height={200}
                            visibleDragbar={false}
                          />
                        );
                      }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-auto"
                    onClick={messageEditForm.handleSubmit(onMessageEditSubmit)}
                    disabled={
                      socialModuleProfileFindByIdChatFindByIdMessageUpdate.isPending
                    }
                  >
                    {socialModuleProfileFindByIdChatFindByIdMessageUpdate.isPending
                      ? "Updating..."
                      : "Save changes"}
                  </Button>
                </div>
              </Form>
            </DialogContent>
          </Dialog>
          <Form {...form}>
            <form
              className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {selectedFileNames.length ? (
                <div className="mx-auto mb-2 flex w-full max-w-4xl flex-wrap gap-2">
                  {selectedFileNames.map((fileName) => {
                    return (
                      <span
                        key={fileName}
                        className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500"
                      >
                        {fileName}
                      </span>
                    );
                  })}
                </div>
              ) : null}
              {isKnowledgeCommandPickerOpen ? (
                <div className="mx-auto mb-2 w-full max-w-4xl rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  <Command shouldFilter={false} className="bg-transparent">
                    <CommandList className="max-h-56">
                      {visibleKnowledgeChatCommands.length ? (
                        <CommandGroup>
                          {visibleKnowledgeChatCommands.map((command) => {
                            return (
                              <CommandItem
                                key={command.value}
                                value={command.value}
                                onSelect={() => {
                                  selectKnowledgeCommand(command.value);
                                }}
                                className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2"
                              >
                                <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-900">
                                    {command.title}
                                  </span>
                                  <span className="block text-xs leading-5 text-slate-500">
                                    {command.description}
                                  </span>
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty className="py-6 text-center text-xs text-slate-500">
                          No commands found
                        </CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </div>
              ) : null}
              <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files
                      ? Array.from(event.target.files)
                      : undefined;

                    form.setValue("files", files, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => {
                    return (
                      <textarea
                        {...field}
                        ref={(element) => {
                          field.ref(element);
                          textareaRef.current = element;
                        }}
                        rows={1}
                        placeholder="Write a message..."
                        className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400"
                        onChange={(event) => {
                          field.onChange(event);
                          event.currentTarget.style.height = "auto";
                          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" || event.shiftKey) {
                            return;
                          }

                          event.preventDefault();
                          void form.handleSubmit(onSubmit)();
                          if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                          }
                        }}
                      />
                    );
                  }}
                />
                <button
                  type="button"
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 sm:inline-flex"
                  aria-label="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
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
              </div>
            </form>
          </Form>
        </div>
        {isKnowledgeChat && isKnowledgeSidebarOpen ? (
          <aside className="hidden min-h-0 w-96 shrink-0 border-l border-slate-200 lg:block">
            {renderKnowledgeDocumentsPanel()}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
