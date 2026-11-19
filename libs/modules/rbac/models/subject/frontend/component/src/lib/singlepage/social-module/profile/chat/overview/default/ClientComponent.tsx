"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";
import {
  emptyLocalizedTextFields,
  getLocalizedText,
  hasLocalizedText,
  type LocalizedTextFields,
  normalizeLocalizedTextFields,
} from "../../title";
import { api, queryClient } from "@sps/rbac/models/subject/sdk/client";
import {
  getAIChatDocument,
  route,
  type IModel as IRbacSubject,
} from "@sps/rbac/models/subject/sdk/model";
import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";
import { ChatWorkspace, FormField, Icon } from "@sps/ui-adapter";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Form,
} from "@sps/shared-ui-shadcn";
import {
  Edit3,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SettingsTab = "general" | "threads" | "members";

type ProfileListItem = {
  profile: ISocialModuleProfile;
  title: string;
  subtitle: string;
  initial: string;
  searchText: string;
};

type AgentSubjectListItem = {
  subject: IRbacSubject;
  title: string;
  subtitle: string;
  initial: string;
};

type ProfileRemovalIntent = {
  item: ProfileListItem;
  mode: "remove" | "leave";
};

type ThreadDeletionIntent = {
  id: string;
  title: string;
};

type ChatSettingsFormValues = {
  title: LocalizedTextFields;
  description: LocalizedTextFields;
};

function localizedValue(
  value: Record<string, string | undefined> | null | undefined,
  language: string,
) {
  return value?.[language]?.trim() || value?.en?.trim() || value?.ru?.trim();
}

function profileTitle(profile: ISocialModuleProfile, language: string) {
  return (
    localizedValue(profile.title, language) ||
    profile.adminTitle?.trim() ||
    profile.slug?.trim() ||
    "Untitled profile"
  );
}

function profileSubtitle(profile: ISocialModuleProfile, language: string) {
  return (
    localizedValue(profile.subtitle, language) || profile.slug || "Profile"
  );
}

function profileInitial(title: string) {
  return title.trim().slice(0, 1).toUpperCase() || "P";
}

function emptyLocalizedTiptapFields() {
  return emptyLocalizedTextFields();
}

function createTiptapDocumentFromText(text: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text
          ? [
              {
                type: "text",
                text,
              },
            ]
          : undefined,
      },
    ],
  });
}

function normalizeTiptapFieldValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    JSON.parse(trimmedValue);
    return value;
  } catch {
    return createTiptapDocumentFromText(value);
  }
}

function normalizeChatDescription(value: unknown) {
  const normalized = emptyLocalizedTiptapFields();

  if (!value) {
    return normalized;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return normalized;
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);

      if (
        parsedValue &&
        typeof parsedValue === "object" &&
        !Array.isArray(parsedValue) &&
        !("type" in parsedValue)
      ) {
        internationalization.languages.forEach((language) => {
          const localizedDescription = parsedValue[language.code];

          normalized[language.code] =
            typeof localizedDescription === "string"
              ? normalizeTiptapFieldValue(localizedDescription)
              : "";
        });

        return normalized;
      }

      if (
        parsedValue &&
        typeof parsedValue === "object" &&
        !Array.isArray(parsedValue) &&
        "type" in parsedValue
      ) {
        normalized[internationalization.defaultLanguage.code] = trimmedValue;
        return normalized;
      }
    } catch {
      normalized[internationalization.defaultLanguage.code] =
        normalizeTiptapFieldValue(value);
      return normalized;
    }

    normalized[internationalization.defaultLanguage.code] =
      normalizeTiptapFieldValue(value);
    return normalized;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    internationalization.languages.forEach((language) => {
      const localizedDescription = (
        value as Record<string, string | undefined>
      )[language.code];

      normalized[language.code] =
        typeof localizedDescription === "string"
          ? normalizeTiptapFieldValue(localizedDescription)
          : "";
    });
  }

  return normalized;
}

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const ru = props.language === "ru";
  const chatHref = `/${props.language}/social/chats/${props.socialModuleChat.id}`;
  const mobileNavigationId = useId();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [chatPickerOpen, setChatPickerOpen] = useState(false);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);
  const closeChatPicker = useCallback(() => setChatPickerOpen(false), []);
  const [threadSearch, setThreadSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [pendingAddProfileId, setPendingAddProfileId] = useState<string | null>(
    null,
  );
  const [pendingAddAgentSubjectId, setPendingAddAgentSubjectId] = useState<
    string | null
  >(null);
  const [profileRemovalIntent, setProfileRemovalIntent] =
    useState<ProfileRemovalIntent | null>(null);
  const [isChatDeleteConfirmOpen, setIsChatDeleteConfirmOpen] = useState(false);
  const [threadDeletionIntent, setThreadDeletionIntent] =
    useState<ThreadDeletionIntent | null>(null);
  const chatSettingsForm = useForm<ChatSettingsFormValues>({
    defaultValues: {
      title: normalizeLocalizedTextFields(props.socialModuleChat.title),
      description: normalizeChatDescription(props.socialModuleChat.description),
    },
  });
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const socialModuleChatFindByIdUpdate = api.socialModuleChatFindByIdUpdate({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
  });
  const socialModuleChatFindByIdThreadCreate =
    api.socialModuleChatFindByIdThreadCreate({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
    });
  const socialModuleChatFindByIdThreadUpdate =
    api.socialModuleChatFindByIdThreadUpdate({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: editingThreadId || "pending",
    });
  const socialModuleChatFindByIdThreadDelete =
    api.socialModuleChatFindByIdThreadDelete({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: threadDeletionIntent?.id || "pending",
    });
  const socialModuleChatFindByIdProfileCreate =
    api.socialModuleChatFindByIdProfileCreate({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
    });
  const socialModuleChatFindByIdProfileDelete =
    api.socialModuleChatFindByIdProfileDelete({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleProfileId: profileRemovalIntent?.item.profile.id || "pending",
    });
  const socialModuleProfileFindByIdChatFindByIdDelete =
    api.socialModuleProfileFindByIdChatFindByIdDelete({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
    });
  const {
    data: socialModuleThreads,
    isLoading: socialModuleThreadsIsLoading,
    isError: socialModuleThreadsIsError,
    refetch: refetchSocialModuleThreads,
  } = api.socialModuleChatFindByIdThreadFind({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
    params: {
      orderBy: {
        and: [
          {
            column: "createdAt",
            method: "asc",
          },
        ],
      },
    },
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
  const activeSocialModuleThreadId = useMemo(() => {
    if (!socialModuleThreads?.length) {
      return;
    }

    const requestedThread = socialModuleThreads.find((socialModuleThread) => {
      return socialModuleThread.id === props.socialModuleThreadId;
    });

    if (props.socialModuleThreadId) {
      return requestedThread?.id;
    }

    return socialModuleThreads[0]?.id;
  }, [props.socialModuleThreadId, socialModuleThreads]);
  const chatListQueryKey = useMemo(() => {
    return `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/chats`;
  }, [props.data.id, props.socialModuleProfile.id]);
  const currentChatQueryKey = useMemo(() => {
    return `${chatListQueryKey}/${props.socialModuleChat.id}`;
  }, [chatListQueryKey, props.socialModuleChat.id]);

  useEffect(() => {
    if (!activeSocialModuleThreadId || props.socialModuleThreadId) {
      return;
    }

    router.replace(`${chatHref}/threads/${activeSocialModuleThreadId}`);
  }, [
    activeSocialModuleThreadId,
    chatHref,
    props.socialModuleThreadId,
    router,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedMemberSearch(memberSearch.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [memberSearch]);

  useEffect(() => {
    chatSettingsForm.reset({
      title: normalizeLocalizedTextFields(props.socialModuleChat.title),
      description: normalizeChatDescription(props.socialModuleChat.description),
    });
    setShowSettings(false);
    setSettingsTab("general");
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setPendingAddProfileId(null);
    setPendingAddAgentSubjectId(null);
    setProfileRemovalIntent(null);
    setIsChatDeleteConfirmOpen(false);
    setThreadDeletionIntent(null);
    setNewThreadTitle("");
    setEditingThreadId(null);
    setEditThreadTitle("");
  }, [
    chatSettingsForm,
    props.socialModuleChat.description,
    props.socialModuleChat.id,
    props.socialModuleChat.title,
  ]);

  const threadItems = useMemo(() => {
    return (socialModuleThreads || []).map((socialModuleThread, index) => {
      const title =
        socialModuleThread.title?.trim() ||
        `${ru ? "Обсуждение" : "Thread"} ${index + 1}`;

      return {
        data: socialModuleThread,
        title,
        createdAt: new Date(socialModuleThread.createdAt).toLocaleDateString(
          props.language,
        ),
      };
    });
  }, [props.language, ru, socialModuleThreads]);
  const activeSocialModuleThread = socialModuleThreads?.find(
    (thread) => thread.id === activeSocialModuleThreadId,
  );
  const socialModuleMemberProfiles = props.socialModuleChat.participants;
  const documentItems = useMemo(() => {
    if (props.socialModuleChat.variant !== "ai-chat") return [];

    return AI_CHAT_DOCUMENTS.flatMap(({ key }) =>
      threadItems.flatMap((item) => {
        const document = getAIChatDocument(item.data.metadata);
        if (document?.key !== key) return [];

        const owner = socialModuleMemberProfiles?.find(
          (profile) =>
            profile.id === document.profileId &&
            profile.variant === "artificial-intelligence",
        );

        return owner ? [{ ...item, owner }] : [];
      }),
    );
  }, [props.socialModuleChat.variant, socialModuleMemberProfiles, threadItems]);
  const ordinaryThreadItems = useMemo(() => {
    const documentIds = new Set(documentItems.map(({ data }) => data.id));
    return threadItems.filter(({ data }) => !documentIds.has(data.id));
  }, [documentItems, threadItems]);
  const filteredThreadItems = useMemo(() => {
    const normalizedSearch = threadSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return ordinaryThreadItems;
    }

    return ordinaryThreadItems.filter(({ title, data }) =>
      `${title} ${data.id}`.toLowerCase().includes(normalizedSearch),
    );
  }, [ordinaryThreadItems, threadSearch]);
  const memberProfileIds = useMemo(
    () =>
      new Set((socialModuleMemberProfiles || []).map((profile) => profile.id)),
    [socialModuleMemberProfiles],
  );
  const {
    data: searchedSocialModuleProfiles,
    isLoading: searchedSocialModuleProfilesIsLoading,
    isFetching: searchedSocialModuleProfilesIsFetching,
    refetch: refetchSearchedSocialModuleProfiles,
  } = api.socialModuleChatFindByIdProfileSearch({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
    q: debouncedMemberSearch,
    limit: 20,
    reactQueryOptions: {
      enabled:
        showSettings &&
        settingsTab === "members" &&
        debouncedMemberSearch.length >= 2,
    },
  });
  const {
    data: searchedAgentSubjects,
    isLoading: searchedAgentSubjectsIsLoading,
    isFetching: searchedAgentSubjectsIsFetching,
    refetch: refetchSearchedAgentSubjects,
  } = api.socialModuleChatFindByIdAgentSubjectSearch({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
    q: debouncedMemberSearch,
    limit: 20,
    reactQueryOptions: {
      enabled:
        showSettings &&
        settingsTab === "members" &&
        debouncedMemberSearch.length >= 2,
    },
  });
  const memberItems = useMemo<ProfileListItem[]>(() => {
    return (socialModuleMemberProfiles || []).map((socialModuleProfile) => {
      const title = profileTitle(socialModuleProfile, props.language);
      const subtitle = profileSubtitle(socialModuleProfile, props.language);

      return {
        profile: socialModuleProfile,
        title,
        subtitle,
        initial: profileInitial(title),
        searchText: [title, subtitle, socialModuleProfile.slug]
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [props.language, socialModuleMemberProfiles]);
  const knowledgeAssistantProfile = useMemo(
    () =>
      (socialModuleMemberProfiles || []).find(
        (profile) =>
          profile.variant === "artificial-intelligence" &&
          profile.slug?.startsWith("chat-gpt-"),
      ) || null,
    [socialModuleMemberProfiles],
  );
  const artificialIntelligenceOpponentProfile = useMemo(() => {
    if (knowledgeAssistantProfile) {
      return knowledgeAssistantProfile;
    }

    return (
      (socialModuleMemberProfiles || []).find((socialModuleProfile) => {
        return (
          socialModuleProfile.id !== props.socialModuleProfile.id &&
          socialModuleProfile.variant === "artificial-intelligence"
        );
      }) || null
    );
  }, [
    knowledgeAssistantProfile,
    props.socialModuleProfile.id,
    socialModuleMemberProfiles,
  ]);
  const normalizedMemberSearch = memberSearch.trim().toLowerCase();
  const canSearchProfiles = memberSearch.trim().length >= 2;
  const filteredMemberItems = useMemo(() => {
    if (!normalizedMemberSearch) {
      return memberItems;
    }

    return memberItems.filter((profileItem) => {
      return profileItem.searchText.includes(normalizedMemberSearch);
    });
  }, [memberItems, normalizedMemberSearch]);
  const searchedProfileItems = useMemo<ProfileListItem[]>(() => {
    return (searchedSocialModuleProfiles || [])
      .filter((socialModuleProfile) => {
        return !memberProfileIds.has(socialModuleProfile.id);
      })
      .map((socialModuleProfile) => {
        const title = profileTitle(socialModuleProfile, props.language);
        const subtitle = profileSubtitle(socialModuleProfile, props.language);

        return {
          profile: socialModuleProfile,
          title,
          subtitle,
          initial: profileInitial(title),
          searchText: [title, subtitle, socialModuleProfile.slug]
            .join(" ")
            .toLowerCase(),
        };
      });
  }, [memberProfileIds, props.language, searchedSocialModuleProfiles]);
  const searchedAgentSubjectItems = useMemo<AgentSubjectListItem[]>(() => {
    return (searchedAgentSubjects || []).map((subject) => {
      const title = subject.slug || "agent";

      return {
        subject,
        title,
        subtitle: subject.id,
        initial: profileInitial(title),
      };
    });
  }, [searchedAgentSubjects]);
  const chatTitleValues = chatSettingsForm.watch("title");
  const chatDisplayTitle = getLocalizedText(
    chatTitleValues,
    props.language,
    ru ? "Чат без названия" : "Untitled chat",
  );
  const canSaveChatSettings =
    hasLocalizedText(chatTitleValues) &&
    !socialModuleChatFindByIdUpdate.isPending;
  const membersCount = memberProfileIds.size;

  const refetchChatQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: [currentChatQueryKey],
    });
    void queryClient.invalidateQueries({
      queryKey: [chatListQueryKey],
    });
    void queryClient.refetchQueries({
      queryKey: [currentChatQueryKey],
    });
    void queryClient.refetchQueries({
      queryKey: [chatListQueryKey],
    });
  };

  const refetchMemberQueries = () => {
    refetchChatQueries();
  };

  const handleSaveChatSettings = () => {
    const title = chatSettingsForm.getValues("title");

    if (!hasLocalizedText(title)) {
      return;
    }

    socialModuleChatFindByIdUpdate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          title,
          description: chatSettingsForm.getValues("description"),
        },
      },
      {
        onSuccess(data) {
          chatSettingsForm.reset({
            title: normalizeLocalizedTextFields(data.title),
            description: normalizeChatDescription(data.description),
          });
          refetchChatQueries();
          toast.success(ru ? "Настройки сохранены" : "Chat settings saved");
        },
      },
    );
  };

  const handleAddProfile = (profileItem: ProfileListItem) => {
    setPendingAddProfileId(profileItem.profile.id);

    socialModuleChatFindByIdProfileCreate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          socialModuleProfileId: profileItem.profile.id,
        },
      },
      {
        onSuccess() {
          refetchMemberQueries();
          void refetchSearchedSocialModuleProfiles();
          toast.success("Profile added to chat");
        },
        onSettled() {
          setPendingAddProfileId(null);
        },
      },
    );
  };

  const handleAddAgentSubject = (agentSubjectItem: AgentSubjectListItem) => {
    setPendingAddAgentSubjectId(agentSubjectItem.subject.id);

    socialModuleChatFindByIdProfileCreate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          agentSubjectId: agentSubjectItem.subject.id,
        },
      },
      {
        onSuccess() {
          refetchMemberQueries();
          void refetchSearchedAgentSubjects();
          toast.success("Agent profile added to chat");
        },
        onSettled() {
          setPendingAddAgentSubjectId(null);
        },
      },
    );
  };

  const handleConfirmRemoveProfile = () => {
    if (!profileRemovalIntent) {
      return;
    }

    const removalIntent = profileRemovalIntent;

    socialModuleChatFindByIdProfileDelete.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleProfileId: removalIntent.item.profile.id,
      },
      {
        onSuccess() {
          refetchMemberQueries();
          setProfileRemovalIntent(null);

          if (removalIntent.mode === "leave") {
            setShowSettings(false);
            toast.success("You left the chat");
            router.push(`/${props.language}/social/chats`);
          } else {
            toast.success("Profile removed from chat");
          }
        },
      },
    );
  };

  const handleConfirmDeleteChat = () => {
    socialModuleProfileFindByIdChatFindByIdDelete.mutate(
      {
        id: props.data.id,
        socialModuleProfileId: props.socialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
      },
      {
        onSuccess() {
          setIsChatDeleteConfirmOpen(false);
          setShowSettings(false);
          refetchChatQueries();
          toast.success(ru ? "Чат удалён" : "Chat deleted");
          router.push(`/${props.language}/social/chats`);
        },
      },
    );
  };

  const handleCreateThread = () => {
    const title = newThreadTitle.trim();

    if (!title) {
      return;
    }

    socialModuleChatFindByIdThreadCreate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          title,
        },
      },
      {
        onSuccess(data) {
          setNewThreadTitle("");
          setShowSettings(false);
          closeNavigation();
          void refetchSocialModuleThreads();
          toast.success(ru ? "Обсуждение создано" : "Thread created");

          if (data?.id) {
            router.push(
              `/${props.language}/social/chats/${props.socialModuleChat.id}/threads/${data.id}`,
            );
          }
        },
      },
    );
  };

  const handleSaveThread = () => {
    if (!editingThreadId) {
      return;
    }

    const title = editThreadTitle.trim();

    if (!title) {
      return;
    }

    socialModuleChatFindByIdThreadUpdate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleThreadId: editingThreadId,
        data: {
          title,
        },
      },
      {
        onSuccess() {
          setEditingThreadId(null);
          setEditThreadTitle("");
          void refetchSocialModuleThreads();
          toast.success(ru ? "Название обсуждения изменено" : "Thread renamed");
        },
      },
    );
  };

  const handleConfirmDeleteThread = () => {
    if (!threadDeletionIntent) {
      return;
    }

    const deletedThreadId = threadDeletionIntent.id;
    const remainingThreadItems = threadItems.filter((threadItem) => {
      return threadItem.data.id !== deletedThreadId;
    });

    socialModuleChatFindByIdThreadDelete.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleThreadId: deletedThreadId,
      },
      {
        onSuccess() {
          setThreadDeletionIntent(null);
          setEditingThreadId(null);
          setEditThreadTitle("");
          void refetchSocialModuleThreads();
          toast.success(ru ? "Обсуждение удалено" : "Thread deleted");

          if (activeSocialModuleThreadId === deletedThreadId) {
            const nextThread = remainingThreadItems[0];

            if (nextThread?.data.id) {
              router.push(
                `/${props.language}/social/chats/${props.socialModuleChat.id}/threads/${nextThread.data.id}`,
              );
            } else {
              router.push(
                `/${props.language}/social/chats/${props.socialModuleChat.id}`,
              );
            }
          }
        },
      },
    );
  };

  const canManageChat = props.socialModuleChat.variant !== "customer-work";
  const navigationLabel = ru ? "Навигация по чату" : "Chat navigation";
  const documentOwner = documentItems[0]?.owner;
  const openSettings = (tab: SettingsTab) => {
    closeNavigation();
    setSettingsTab(tab);
    setShowSettings(true);
  };
  const navigation = (
    <nav aria-label={navigationLabel} className="min-w-0">
      <h2 className="mb-3 break-words text-lg font-semibold">
        {chatDisplayTitle}
      </h2>
      <div className="space-y-1">
        {canManageChat && (
          <button
            type="button"
            onClick={() => openSettings("general")}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-default-foreground/80 hover:bg-card/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Icon name="gear-six" className="size-4 shrink-0" />
            {ru ? "Настройки" : "Settings"}
          </button>
        )}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            closeNavigation();
            setChatPickerOpen(true);
          }}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-default-foreground/80 hover:bg-card/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Icon name="chat-circle" className="size-4 shrink-0" />
          <span className="flex-1">{ru ? "Все чаты" : "All chats"}</span>
          <Icon name="caret-down" className="size-4 shrink-0" />
        </button>
      </div>
      {documentOwner && (
        <SocialModuleProfile
          isServer={false}
          variant="thread-list-sidebar-ai-chat"
          language={props.language}
          data={documentOwner}
          dataSource="props"
          className="my-4"
          documents={documentItems.map(({ data, title }) => ({
            data,
            dataSource: "props",
            title,
            href: `${chatHref}/threads/${data.id}`,
            selected: data.id === activeSocialModuleThreadId,
            onNavigate: closeNavigation,
          }))}
        />
      )}
      <section
        aria-label={ru ? "Обсуждения" : "Threads"}
        className="mt-5 border-t border-default-foreground/10 pt-4"
      >
        <h3 className="mb-3 text-xs font-semibold text-default-foreground/60">
          {ru ? "Обсуждения" : "Threads"}
        </h3>
        {ordinaryThreadItems.length > 0 && (
          <label className="relative mb-2 block">
            <span className="sr-only">
              {ru ? "Поиск обсуждений" : "Search threads"}
            </span>
            <Icon
              name="magnifying-glass"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-default-foreground/55"
            />
            <input
              type="search"
              value={threadSearch}
              onChange={(event) => setThreadSearch(event.target.value)}
              placeholder={ru ? "Поиск обсуждений" : "Search threads"}
              className="h-9 w-full rounded-lg border border-default-foreground/15 bg-card/5 pl-8 pr-2 text-sm placeholder:text-default-foreground/55 focus:border-default-foreground/55"
            />
          </label>
        )}
        {socialModuleThreadsIsLoading ? (
          <p
            role="status"
            className="px-2 py-1 text-sm text-default-foreground/65"
          >
            {ru ? "Загрузка обсуждений…" : "Loading threads…"}
          </p>
        ) : filteredThreadItems.length ? (
          <ul>
            {filteredThreadItems.map(({ data, title }) => (
              <li key={data.id}>
                <SocialModuleThread
                  isServer={false}
                  variant="list-item-sidebar-ai-chat"
                  language={props.language}
                  data={data}
                  dataSource="props"
                  topic
                  href={`${chatHref}/threads/${data.id}`}
                  title={title}
                  selected={data.id === activeSocialModuleThreadId}
                  onNavigate={closeNavigation}
                />
              </li>
            ))}
          </ul>
        ) : (
          !socialModuleThreadsIsError &&
          (!documentOwner || threadSearch) && (
            <p className="px-2 py-1 text-sm text-default-foreground/65">
              {threadSearch
                ? ru
                  ? "Обсуждения не найдены"
                  : "No matching threads"
                : ru
                  ? "Обсуждений пока нет"
                  : "No threads yet"}
            </p>
          )
        )}
        {canManageChat && (
          <button
            type="button"
            onClick={() => openSettings("threads")}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-default-foreground/15 px-3 py-2 text-left text-sm text-default-foreground/80 hover:bg-card/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Icon name="plus" className="size-4 shrink-0" />
            {ru ? "Новое обсуждение" : "New thread"}
          </button>
        )}
      </section>
    </nav>
  );
  const navigationTrigger = (
    <button
      type="button"
      aria-label={navigationLabel}
      aria-controls={mobileNavigationId}
      aria-expanded={navigationOpen}
      onClick={() => setNavigationOpen((open) => !open)}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
    >
      <Menu className="size-5" aria-hidden="true" />
    </button>
  );

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "mx-auto min-w-0 w-full max-w-6xl px-4 py-6 sm:px-6",
        props.className,
      )}
    >
      <div
        id={mobileNavigationId}
        hidden={!navigationOpen}
        className="mb-3 max-h-[70dvh] overflow-y-auto rounded-2xl bg-default p-4 text-default-foreground lg:hidden"
      >
        {navigationOpen && navigation}
      </div>
      <ChatWorkspace navigation={navigation}>
        {activeSocialModuleThreadId && activeSocialModuleThread ? (
          <Subject
            isServer={false}
            data={props.data}
            language={props.language}
            socialModuleChat={props.socialModuleChat}
            socialModuleProfile={props.socialModuleProfile}
            artificialIntelligenceOpponentProfile={
              artificialIntelligenceOpponentProfile
            }
            knowledgeAssistantProfile={knowledgeAssistantProfile}
            socialModuleThread={activeSocialModuleThread}
            socialModuleThreadId={activeSocialModuleThreadId}
            variant="social-module-profile-chat-message-list-default"
            navigation={navigationTrigger}
          />
        ) : (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
              {navigationTrigger}
              <h2 className="truncate text-sm font-semibold">
                {chatDisplayTitle}
              </h2>
            </header>
            <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-6 text-center">
              <div>
                <p role="status" className="text-sm text-muted-foreground">
                  {socialModuleThreadsIsLoading
                    ? ru
                      ? "Загрузка обсуждений…"
                      : "Loading threads…"
                    : socialModuleThreadsIsError
                      ? ru
                        ? "Не удалось загрузить обсуждения."
                        : "Could not load threads."
                      : props.socialModuleThreadId
                        ? ru
                          ? "Обсуждение недоступно."
                          : "This thread is unavailable."
                        : ru
                          ? "В этом чате пока нет обсуждений."
                          : "This chat has no threads yet."}
                </p>
                {socialModuleThreadsIsError && (
                  <button
                    type="button"
                    onClick={() => void refetchSocialModuleThreads()}
                    className="mt-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    {ru ? "Повторить попытку" : "Try again"}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </ChatWorkspace>
      <Dialog open={chatPickerOpen} onOpenChange={setChatPickerOpen}>
        <DialogContent
          aria-describedby={undefined}
          closeLabel={ru ? "Закрыть список чатов" : "Close chat list"}
          className="flex max-h-[80dvh] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl p-0"
        >
          <DialogTitle className="sr-only">{ru ? "Чаты" : "Chats"}</DialogTitle>
          <Subject
            isServer={false}
            variant="social-module-profile-chat-list-default"
            data={props.data}
            language={props.language}
            socialModuleProfile={props.socialModuleProfile}
            includeSubjectProfiles
            currentSocialModuleChatId={props.socialModuleChat.id}
            compact
            onSelectChat={closeChatPicker}
          />
        </DialogContent>
      </Dialog>
      {showSettings && canManageChat ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowSettings(false);
          }}
        >
          <div
            className="mx-4 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-slate-900">
                  {chatDisplayTitle}
                </h3>
                <p className="truncate text-xs text-slate-400">
                  {ru
                    ? `Участники (${membersCount}) · Обсуждения (${threadItems.length})`
                    : `${membersCount} member${membersCount === 1 ? "" : "s"} · ${threadItems.length} thread${threadItems.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">
                  {ru ? "Закрыть настройки" : "Close settings"}
                </span>
              </button>
            </div>
            <div className="flex shrink-0 border-b border-slate-200">
              {[
                { key: "general" as const, label: ru ? "Основное" : "General" },
                {
                  key: "threads" as const,
                  label: `${ru ? "Обсуждения" : "Threads"} (${threadItems.length})`,
                },
                {
                  key: "members" as const,
                  label: `${ru ? "Участники" : "Members"} (${membersCount})`,
                },
              ].map((tab) => {
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={settingsTab === tab.key}
                    onClick={() => {
                      setSettingsTab(tab.key);
                    }}
                    className={cn(
                      "flex-1 px-3 py-2.5 text-xs transition",
                      settingsTab === tab.key
                        ? "border-b-2 border-slate-900 text-slate-900"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
              {settingsTab === "general" ? (
                <Form {...chatSettingsForm}>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        {ru ? "Название" : "Name"}
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {internationalization.languages.map((language) => {
                          return (
                            <FormField
                              key={language.code}
                              ui="shadcn"
                              type="text"
                              name={`title.${language.code}`}
                              label={language.title}
                              form={chatSettingsForm}
                              labelClassName="mb-1 text-[11px] font-normal text-slate-400"
                              inputClassName="border-slate-200 bg-slate-50 text-sm text-slate-700"
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        {ru ? "Описание" : "Description"}
                      </label>
                      <div className="space-y-3">
                        {internationalization.languages.map((language) => {
                          return (
                            <FormField
                              key={language.code}
                              ui="shadcn"
                              type="tiptap"
                              name={`description.${language.code}`}
                              label={language.title}
                              form={chatSettingsForm}
                              labelClassName="mb-1 text-[11px] font-normal text-slate-400"
                              inputClassName="min-h-28 border-slate-200 bg-slate-50 text-sm text-slate-700"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Form>
              ) : null}
              {settingsTab === "threads" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(event) => {
                        setNewThreadTitle(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleCreateThread();
                        }
                      }}
                      aria-label={ru ? "Название обсуждения" : "Thread title"}
                      placeholder={ru ? "Название обсуждения" : "Thread title"}
                      className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleCreateThread}
                      disabled={
                        !newThreadTitle.trim() ||
                        socialModuleChatFindByIdThreadCreate.isPending
                      }
                      className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-[11px] text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      {ru ? "Создать" : "Create"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {threadItems.length ? (
                      threadItems.map((threadItem) => {
                        return (
                          <div
                            key={threadItem.data.id}
                            className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-slate-700">
                                {threadItem.title}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {threadItem.createdAt}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditThreadTitle(threadItem.title);
                                setEditingThreadId(threadItem.data.id);
                              }}
                              title={
                                ru
                                  ? "Переименовать обсуждение"
                                  : "Rename thread"
                              }
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span className="sr-only">
                                {ru
                                  ? "Переименовать обсуждение"
                                  : "Rename thread"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setThreadDeletionIntent({
                                  id: threadItem.data.id,
                                  title: threadItem.title,
                                });
                              }}
                              title={
                                ru ? "Удалить обсуждение" : "Delete thread"
                              }
                              disabled={
                                socialModuleChatFindByIdThreadDelete.isPending
                              }
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">
                                {ru ? "Удалить обсуждение" : "Delete thread"}
                              </span>
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-6 text-center text-xs text-slate-400">
                        {ru ? "Обсуждений пока нет" : "No threads yet"}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              {settingsTab === "members" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(event) => {
                        setMemberSearch(event.target.value);
                      }}
                      placeholder="Search users..."
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                    {memberSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMemberSearch("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear member search</span>
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-[11px] text-slate-400">
                      Members ({membersCount})
                    </h4>
                    <div className="space-y-1">
                      {filteredMemberItems.length ? (
                        filteredMemberItems.map((profileItem) => {
                          const isCurrentProfile =
                            profileItem.profile.id ===
                            props.socialModuleProfile.id;

                          return (
                            <div
                              key={profileItem.profile.id}
                              className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-slate-50"
                            >
                              <SocialModuleProfile
                                isServer={false}
                                variant="chat-profile-avatar"
                                data={profileItem.profile}
                                language={props.language}
                                className="h-7 w-7 text-[11px]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs text-slate-700">
                                  {profileItem.title}
                                </p>
                                <p className="truncate text-[10px] text-slate-400">
                                  {profileItem.subtitle}
                                </p>
                              </div>
                              {isCurrentProfile ? (
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                    You
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProfileRemovalIntent({
                                        item: profileItem,
                                        mode: "leave",
                                      });
                                    }}
                                    title={
                                      membersCount > 1
                                        ? "Leave chat"
                                        : "Cannot leave the last member chat"
                                    }
                                    disabled={
                                      membersCount <= 1 ||
                                      socialModuleChatFindByIdProfileDelete.isPending
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="sr-only">Leave chat</span>
                                  </button>
                                </div>
                              ) : membersCount > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfileRemovalIntent({
                                      item: profileItem,
                                      mode: "remove",
                                    });
                                  }}
                                  title="Remove member"
                                  disabled={
                                    socialModuleChatFindByIdProfileDelete.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  <span className="sr-only">Remove member</span>
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {memberSearch
                            ? "No matching members"
                            : "No members found"}
                        </p>
                      )}
                    </div>
                  </div>
                  {memberSearch.trim() ? (
                    <div className="border-t border-slate-200 pt-3">
                      <h4 className="mb-1.5 text-[11px] text-slate-400">
                        User profiles
                      </h4>
                      {!canSearchProfiles ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Type at least 2 characters to search users.
                        </p>
                      ) : searchedSocialModuleProfilesIsLoading ||
                        searchedSocialModuleProfilesIsFetching ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Searching users...
                        </p>
                      ) : searchedProfileItems.length ? (
                        <div className="space-y-1">
                          {searchedProfileItems.map((profileItem) => {
                            const isAdding =
                              pendingAddProfileId === profileItem.profile.id;

                            return (
                              <div
                                key={profileItem.profile.id}
                                className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-slate-50"
                              >
                                <SocialModuleProfile
                                  isServer={false}
                                  variant="chat-profile-avatar"
                                  data={profileItem.profile}
                                  language={props.language}
                                  className="h-7 w-7 text-[11px] opacity-70"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs text-slate-500">
                                    {profileItem.title}
                                  </p>
                                  <p className="truncate text-[10px] text-slate-400">
                                    {profileItem.subtitle}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddProfile(profileItem);
                                  }}
                                  title="Add member"
                                  disabled={
                                    isAdding ||
                                    socialModuleChatFindByIdProfileCreate.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span className="sr-only">Add member</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          No users found
                        </p>
                      )}
                      <h4 className="mb-1.5 mt-3 text-[11px] text-slate-400">
                        Agents
                      </h4>
                      {!canSearchProfiles ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Type at least 2 characters to search agents.
                        </p>
                      ) : searchedAgentSubjectsIsLoading ||
                        searchedAgentSubjectsIsFetching ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Searching agents...
                        </p>
                      ) : searchedAgentSubjectItems.length ? (
                        <div className="space-y-1">
                          {searchedAgentSubjectItems.map((agentSubjectItem) => {
                            const isAdding =
                              pendingAddAgentSubjectId ===
                              agentSubjectItem.subject.id;

                            return (
                              <div
                                key={agentSubjectItem.subject.id}
                                className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-slate-50"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 opacity-70">
                                  {agentSubjectItem.initial}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs text-slate-500">
                                    {agentSubjectItem.title}
                                  </p>
                                  <p className="truncate text-[10px] text-slate-400">
                                    Agent subject
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddAgentSubject(agentSubjectItem);
                                  }}
                                  title="Add agent"
                                  disabled={
                                    isAdding ||
                                    socialModuleChatFindByIdProfileCreate.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span className="sr-only">Add agent</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          No agents found
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {settingsTab === "general" ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsChatDeleteConfirmOpen(true);
                  }}
                  disabled={
                    socialModuleProfileFindByIdChatFindByIdDelete.isPending
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete chat
                </button>
                <button
                  type="button"
                  onClick={handleSaveChatSettings}
                  disabled={!canSaveChatSettings}
                  className="h-9 rounded-md bg-slate-900 px-4 text-xs text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900"
                >
                  {socialModuleChatFindByIdUpdate.isPending
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {isChatDeleteConfirmOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => {
            if (!socialModuleProfileFindByIdChatFindByIdDelete.isPending) {
              setIsChatDeleteConfirmOpen(false);
            }
          }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">
                Delete chat
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsChatDeleteConfirmOpen(false);
                }}
                disabled={
                  socialModuleProfileFindByIdChatFindByIdDelete.isPending
                }
                className="text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close confirmation</span>
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Delete{" "}
              <span className="font-medium text-slate-900">
                {chatDisplayTitle}
              </span>
              ? This chat will be deleted for all members, including its
              threads, messages, and actions.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChatDeleteConfirmOpen(false);
                }}
                disabled={
                  socialModuleProfileFindByIdChatFindByIdDelete.isPending
                }
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteChat}
                disabled={
                  socialModuleProfileFindByIdChatFindByIdDelete.isPending
                }
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
              >
                {socialModuleProfileFindByIdChatFindByIdDelete.isPending
                  ? "Deleting..."
                  : "Delete chat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {profileRemovalIntent ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => {
            if (!socialModuleChatFindByIdProfileDelete.isPending) {
              setProfileRemovalIntent(null);
            }
          }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">
                {profileRemovalIntent.mode === "leave"
                  ? "Leave chat"
                  : "Remove member"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setProfileRemovalIntent(null);
                }}
                disabled={socialModuleChatFindByIdProfileDelete.isPending}
                className="text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close confirmation</span>
              </button>
            </div>
            {profileRemovalIntent.mode === "leave" ? (
              <p className="text-sm leading-6 text-slate-600">
                Leave{" "}
                <span className="font-medium text-slate-900">
                  {chatDisplayTitle}
                </span>
                ? You will no longer see this chat in your chat list.
              </p>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Remove{" "}
                <span className="font-medium text-slate-900">
                  {profileRemovalIntent.item.title}
                </span>{" "}
                from this chat?
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileRemovalIntent(null);
                }}
                disabled={socialModuleChatFindByIdProfileDelete.isPending}
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveProfile}
                disabled={socialModuleChatFindByIdProfileDelete.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
              >
                {socialModuleChatFindByIdProfileDelete.isPending
                  ? profileRemovalIntent.mode === "leave"
                    ? "Leaving..."
                    : "Removing..."
                  : profileRemovalIntent.mode === "leave"
                    ? "Leave chat"
                    : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {threadDeletionIntent ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => {
            if (!socialModuleChatFindByIdThreadDelete.isPending) {
              setThreadDeletionIntent(null);
            }
          }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">
                Delete thread
              </h3>
              <button
                type="button"
                onClick={() => {
                  setThreadDeletionIntent(null);
                }}
                disabled={socialModuleChatFindByIdThreadDelete.isPending}
                className="text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close confirmation</span>
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Delete{" "}
              <span className="font-medium text-slate-900">
                {threadDeletionIntent.title}
              </span>
              ? Messages in this thread will be removed from this chat. If it is
              linked to a Telegram topic, the topic will also be deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setThreadDeletionIntent(null);
                }}
                disabled={socialModuleChatFindByIdThreadDelete.isPending}
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteThread}
                disabled={socialModuleChatFindByIdThreadDelete.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
              >
                {socialModuleChatFindByIdThreadDelete.isPending
                  ? "Deleting..."
                  : "Delete thread"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {editingThreadId ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => {
            setEditingThreadId(null);
          }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">
                Edit Thread
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingThreadId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close editor</span>
              </button>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">
                Title
              </label>
              <input
                type="text"
                value={editThreadTitle}
                onChange={(event) => {
                  setEditThreadTitle(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSaveThread();
                  }
                }}
                autoFocus
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingThreadId(null);
                }}
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveThread}
                disabled={
                  !editThreadTitle.trim() ||
                  socialModuleChatFindByIdThreadUpdate.isPending
                }
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
