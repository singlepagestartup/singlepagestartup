"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IChatProfileOpen } from "../../message/list/default/interface";
import { ChatParticipantButton } from "../../message/list/default/components/ChatParticipantButton";
import { ChatCover } from "./ChatCover";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";
import {
  CLOSED_THREAD_VARIANT,
  SUPPORT_THREAD_VARIANT,
} from "@sps/social/models/thread/sdk/model";
import {
  emptyLocalizedTextFields,
  getLocalizedText,
  hasLocalizedText,
  type LocalizedTextFields,
  normalizeLocalizedTextFields,
} from "../../title";
import { api, queryClient } from "@sps/rbac/models/subject/sdk/client";
import {
  route,
  STORE_EMPLOYEE_CHAT_VARIANT,
  type IModel as IRbacSubject,
} from "@sps/rbac/models/subject/sdk/model";
import {
  ChatWorkspace,
  ChatWorkspaceNavigation,
  ChatThreadSkeleton,
  FormField,
  Icon,
} from "@sps/ui-adapter";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { Button, Form, ImageUploadField } from "@sps/shared-ui-shadcn";
import {
  ArrowLeft,
  Edit3,
  LogOut,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isChatAccessError } from "../../message/list/default/utils";

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

function useChatThreads(subjectId: string, chatId: string, limit?: number) {
  return api.socialModuleChatFindByIdThreadFind({
    id: subjectId,
    socialModuleChatId: chatId,
    params: {
      ...(limit && limit > 100 ? { limit } : {}),
      orderBy: {
        and: [{ column: "createdAt", method: "asc" }],
      },
    },
    options: {
      headers: { "Cache-Control": "no-store" },
    },
  });
}

export function Component(props: IComponentPropsExtended) {
  if (props.socialModuleEmployeeProfileId) {
    const chat = props.socialModuleChat;
    const members = chat.participants ?? [];
    const employeeIsPresent = members.some(
      (profile) =>
        profile.id === props.socialModuleEmployeeProfileId &&
        profile.variant === "artificial-intelligence",
    );
    if (
      chat.id !== props.socialModuleChatId ||
      chat.variant !== STORE_EMPLOYEE_CHAT_VARIANT ||
      !employeeIsPresent ||
      !members.some((profile) => profile.id === props.socialModuleProfile.id)
    ) {
      return (
        <p role="status" className="rounded-xl border border-border p-4">
          {props.language === "ru"
            ? "Служебный чат недоступен."
            : "The staff chat is unavailable."}
        </p>
      );
    }
  }
  return <ChatOverview key={props.socialModuleChat.id} {...props} />;
}

function ChatOverview(props: IComponentPropsExtended) {
  const router = useRouter();
  const ru = props.language === "ru";
  const chatHref = `/${props.language}/social/chats/${props.socialModuleChat.id}`;
  const embedded = Boolean(
    props.getThreadHref || props.socialModuleEmployeeProfileId,
  );
  const threadHref = (threadId: string) =>
    props.getThreadHref?.(threadId) ?? `${chatHref}/threads/${threadId}`;
  const profileOpenRef = useRef<IChatProfileOpen>(null);
  const openMemberProfile = useCallback<IChatProfileOpen>(
    (...args) => profileOpenRef.current?.(...args),
    [],
  );
  const mobileNavigationId = useId();
  const navigationHref = props.socialModuleThreadId
    ? threadHref(props.socialModuleThreadId)
    : chatHref;
  const [mobileNavigation, setMobileNavigation] = useState<{
    href: string;
    open: boolean;
  } | null>(null);
  const [chatListChatId, setChatListChatId] = useState<string | null>(null);
  const closeNavigation = useCallback(() => {
    setMobileNavigation({ href: navigationHref, open: false });
  }, [navigationHref]);
  const [threadSearch, setThreadSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSettingsTab, setSettingsTab] =
    useState<SettingsTab>("general");
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
    data: loadedThreads,
    error: threadError,
    isLoading: socialModuleThreadsIsLoading,
    isError: socialModuleThreadsIsError,
    refetch: refetchSocialModuleThreads,
  } = useChatThreads(
    props.data.id,
    props.socialModuleChat.id,
    props.threadListLimit,
  );
  const accessDenied = isChatAccessError(threadError);
  const taskChat =
    props.socialModuleChat.taskChatStaff !== undefined ||
    Boolean(props.socialModuleChat.mainThreadId) ||
    Boolean(props.socialModuleChat.taskChatThreadId) ||
    props.socialModuleChat.variant === "customer-work";
  const employeeChat =
    props.socialModuleChat.variant === STORE_EMPLOYEE_CHAT_VARIANT;
  const standardChat = !taskChat && !employeeChat;
  const scopedThreadId = props.socialModuleChat.taskChatThreadId;
  const canManageChat =
    !accessDenied &&
    !scopedThreadId &&
    props.socialModuleChat.canManageChat === true;
  const canManageMembers = canManageChat && !employeeChat;
  const settingsTab = canManageChat ? selectedSettingsTab : "members";
  const mainThreadId =
    props.socialModuleChat.mainThreadId ?? props.defaultThreadId;
  const requestedThreadId = props.socialModuleThreadId;
  const lookupRequestedThread = Boolean(
    requestedThreadId &&
    loadedThreads &&
    !accessDenied &&
    !loadedThreads.some(({ id }) => id === requestedThreadId),
  );
  const requestedThread = api.socialModuleChatFindByIdThreadFind({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
    params: { threadId: requestedThreadId },
    reactQueryOptions: { enabled: lookupRequestedThread, retry: false },
  });
  const linkedRequestedThread =
    lookupRequestedThread && !isChatAccessError(requestedThread.error)
      ? requestedThread.data?.find(({ id }) => id === requestedThreadId)
      : undefined;
  const listedSupport = loadedThreads?.find(
    ({ variant }) => variant === SUPPORT_THREAD_VARIANT,
  );
  const socialModuleThreads = useMemo(() => {
    if (accessDenied) return undefined;
    const threads = linkedRequestedThread
      ? [...(loadedThreads ?? []), linkedRequestedThread]
      : loadedThreads;
    if (scopedThreadId) {
      return threads?.filter(
        ({ id, variant }) =>
          id === scopedThreadId || variant === SUPPORT_THREAD_VARIANT,
      );
    }
    return threads;
  }, [accessDenied, linkedRequestedThread, loadedThreads, scopedThreadId]);
  const activeSocialModuleThread = requestedThreadId
    ? socialModuleThreads?.find(({ id }) => id === requestedThreadId)
    : (socialModuleThreads?.find(
        ({ variant }) => variant !== SUPPORT_THREAD_VARIANT,
      ) ?? socialModuleThreads?.[0]);
  const lookupSupport =
    activeSocialModuleThread?.variant === CLOSED_THREAD_VARIANT &&
    !listedSupport;
  const supportThreads = api.socialModuleChatFindByIdThreadFind({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChat.id,
    params: { variant: SUPPORT_THREAD_VARIANT },
    reactQueryOptions: { enabled: lookupSupport, retry: false },
  });
  const supportThread =
    listedSupport ??
    (lookupSupport && !isChatAccessError(supportThreads.error)
      ? supportThreads.data?.find(
          ({ variant }) => variant === SUPPORT_THREAD_VARIANT,
        )
      : undefined);
  const supportHref =
    activeSocialModuleThread?.variant === CLOSED_THREAD_VARIANT && supportThread
      ? threadHref(supportThread.id)
      : undefined;
  const activeSocialModuleThreadId = activeSocialModuleThread?.id;
  const hasMultipleThreads = (socialModuleThreads?.length ?? 0) > 1;
  const showThreads =
    embedded ||
    (hasMultipleThreads && chatListChatId !== props.socialModuleChat.id);
  const navigationOpen =
    mobileNavigation?.href === navigationHref
      ? mobileNavigation.open
      : !props.socialModuleThreadId && hasMultipleThreads;
  const selectCurrentChat = useCallback(() => {
    setChatListChatId(null);
    setThreadSearch("");
    setMobileNavigation({ href: navigationHref, open: hasMultipleThreads });
  }, [hasMultipleThreads, navigationHref]);
  const chatListQueryKey = useMemo(() => {
    return `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/chats`;
  }, [props.data.id, props.socialModuleProfile.id]);
  const currentChatQueryKey = useMemo(() => {
    return `${chatListQueryKey}/${props.socialModuleChat.id}`;
  }, [chatListQueryKey, props.socialModuleChat.id]);

  useEffect(() => {
    if (
      embedded ||
      !activeSocialModuleThreadId ||
      props.socialModuleThreadId ||
      hasMultipleThreads
    ) {
      return;
    }

    router.replace(`${chatHref}/threads/${activeSocialModuleThreadId}`);
  }, [
    embedded,
    activeSocialModuleThreadId,
    chatHref,
    hasMultipleThreads,
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
    chatSettingsForm.reset(
      {
        title: normalizeLocalizedTextFields(props.socialModuleChat.title),
        description: normalizeChatDescription(
          props.socialModuleChat.description,
        ),
      },
      { keepDirtyValues: true },
    );
  }, [
    chatSettingsForm,
    props.socialModuleChat.title,
    props.socialModuleChat.description,
  ]);

  const threadItems = useMemo(() => {
    const authors = new Map(
      (props.socialModuleChat.participants ?? []).map((profile) => [
        profile.id,
        profileTitle(profile, props.language),
      ]),
    );
    return (socialModuleThreads || []).map((socialModuleThread, index) => {
      const title =
        socialModuleThread.id === props.defaultThreadId &&
        (!taskChat || !socialModuleThread.title?.trim())
          ? ru
            ? "Основная переписка"
            : "Main conversation"
          : socialModuleThread.title?.trim() ||
            `${ru ? "Обсуждение" : "Thread"} ${index + 1}`;

      return {
        data: socialModuleThread,
        title,
        previewAuthor: socialModuleThread.lastMessageAuthorId
          ? authors.get(socialModuleThread.lastMessageAuthorId)
          : undefined,
        canDelete:
          socialModuleThread.variant !== SUPPORT_THREAD_VARIANT &&
          (standardChat || socialModuleThread.id !== mainThreadId) &&
          !(employeeChat && socialModuleThread.hasCustomerWork),
        createdAt: new Date(socialModuleThread.createdAt).toLocaleDateString(
          props.language,
        ),
      };
    });
  }, [
    props.defaultThreadId,
    props.socialModuleChat.participants,
    props.language,
    ru,
    socialModuleThreads,
    taskChat,
    standardChat,
    mainThreadId,
    employeeChat,
  ]);
  const socialModuleMemberProfiles = props.socialModuleChat.participants;
  const filteredThreadItems = useMemo(() => {
    const normalizedSearch = threadSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return threadItems;
    }

    return threadItems.filter(({ title, data }) =>
      `${title} ${data.id}`.toLowerCase().includes(normalizedSearch),
    );
  }, [threadItems, threadSearch]);
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
        canManageMembers &&
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
        canManageMembers &&
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
    if (props.socialModuleEmployeeProfileId) {
      return (
        socialModuleMemberProfiles?.find(
          ({ id }) => id === props.socialModuleEmployeeProfileId,
        ) ?? null
      );
    }
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
    props.socialModuleEmployeeProfileId,
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
  const chatDisplayTitle = getLocalizedText(
    props.socialModuleChat.title,
    props.language,
    ru ? "Чат без названия" : "Untitled chat",
  );
  const membersCount = memberProfileIds.size;

  const refetchChatQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: [currentChatQueryKey],
    });
    void queryClient.invalidateQueries({
      queryKey: [chatListQueryKey],
    });
  };

  const refetchMemberQueries = () => {
    refetchChatQueries();
  };

  const handleSaveChatSettings = () => {
    const title = chatSettingsForm.getValues("title");

    if (!canManageChat || !hasLocalizedText(title)) {
      return;
    }

    socialModuleChatFindByIdUpdate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleProfileId: props.socialModuleProfile.id,
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
    if (!canManageMembers) return;
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
          toast.success(ru ? "Участник добавлен" : "Profile added to chat");
        },
        onSettled() {
          setPendingAddProfileId(null);
        },
      },
    );
  };

  const handleAddAgentSubject = (agentSubjectItem: AgentSubjectListItem) => {
    if (!canManageMembers) return;
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
          toast.success(ru ? "Агент добавлен" : "Agent profile added to chat");
        },
        onSettled() {
          setPendingAddAgentSubjectId(null);
        },
      },
    );
  };

  const handleConfirmRemoveProfile = () => {
    if (
      !canManageMembers ||
      !profileRemovalIntent ||
      props.socialModuleChat.protectedProfileIds?.includes(
        profileRemovalIntent.item.profile.id,
      )
    ) {
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
            toast.success(ru ? "Вы вышли из чата" : "You left the chat");
            router.push(`/${props.language}/social/chats`);
          } else {
            toast.success(ru ? "Участник удалён" : "Profile removed from chat");
          }
        },
      },
    );
  };

  const handleConfirmDeleteChat = () => {
    if (!canManageChat || !standardChat) return;
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

  const creatingThread =
    socialModuleChatFindByIdThreadCreate.isPending || props.isCreatingThread;
  const handleCreateThread = async () => {
    const title = newThreadTitle.trim();
    if (!canManageChat || !title || creatingThread) return;
    function opened(id?: string) {
      setNewThreadTitle("");
      setShowSettings(false);
      closeNavigation();
      toast.success(ru ? "Обсуждение создано" : "Thread created");
      if (id)
        router.push(threadHref(id), embedded ? { scroll: false } : undefined);
    }
    if (embedded && props.onCreateThread) {
      try {
        opened(await props.onCreateThread(title));
      } catch {
        toast.error(
          ru
            ? "Не удалось создать обсуждение. Попробуйте ещё раз."
            : "Could not create the thread. Try again.",
        );
      }
      return;
    }
    socialModuleChatFindByIdThreadCreate.mutate(
      {
        id: props.data.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: { title },
      },
      {
        onSuccess(data) {
          void refetchSocialModuleThreads();
          opened(data?.id);
        },
      },
    );
  };

  const handleSaveThread = () => {
    if (!canManageChat || !editingThreadId) {
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
    if (
      !canManageChat ||
      !threadDeletionIntent ||
      !threadItems.some(
        (item) => item.data.id === threadDeletionIntent.id && item.canDelete,
      )
    ) {
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
              router.push(threadHref(nextThread.data.id), {
                scroll: !embedded,
              });
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

  const backToChats = ru ? "К списку чатов" : "Back to chats";
  const threadListLabel = ru ? "Обсуждения" : "Threads";
  const threadSearchLabel = ru ? "Поиск обсуждений" : "Search threads";
  const settingsLabel = ru ? "Настройки чата" : "Chat settings";
  const navigationLabel = showThreads
    ? ru
      ? "К списку обсуждений"
      : "Back to threads"
    : backToChats;
  const navigationButtonClassName =
    "grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2";
  const openSettings = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setShowSettings(true);
  };
  const settingsButton = !accessDenied && (
    <button
      type="button"
      aria-label={settingsLabel}
      title={settingsLabel}
      onClick={() => openSettings(canManageChat ? "general" : "members")}
      className={navigationButtonClassName}
    >
      <Icon name="gear-six" className="size-5" />
    </button>
  );
  const coverProps = props.socialModuleChat.coverFileId
    ? {
        subjectId: props.data.id,
        profileId: props.socialModuleProfile.id,
        chatId: props.socialModuleChat.id,
        fileId: props.socialModuleChat.coverFileId,
        language: props.language,
      }
    : null;
  const saveCover = async (data: { file: File } | { reset: true }) => {
    if (!canManageChat)
      throw new Error(ru ? "Доступ изменился." : "Your access has changed.");
    return socialModuleChatFindByIdUpdate.mutateAsync({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      data: "file" in data ? { coverFile: data.file } : { removeCover: true },
    });
  };
  const navigation = showThreads ? (
    <ChatWorkspaceNavigation
      label={threadListLabel}
      title={chatDisplayTitle}
      search={{
        label: threadSearchLabel,
        value: threadSearch,
        onChange: setThreadSearch,
      }}
      leading={
        <>
          {!embedded && (
            <button
              type="button"
              aria-label={backToChats}
              title={backToChats}
              onClick={() => {
                setChatListChatId(props.socialModuleChat.id);
                setThreadSearch("");
              }}
              className={navigationButtonClassName}
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
          )}
          {coverProps && <ChatCover {...coverProps} compact />}
        </>
      }
      actions={settingsButton}
      footer={
        canManageChat && (
          <div className="shrink-0 border-t border-border p-3">
            <button
              type="button"
              onClick={() => openSettings("threads")}
              className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              {ru ? "Новое обсуждение" : "New thread"}
            </button>
          </div>
        )
      }
    >
      {filteredThreadItems.length ? (
        <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
          {filteredThreadItems.map(({ data, title, previewAuthor }) => (
            <li key={data.id} className="min-w-0">
              <SocialModuleThread
                isServer={false}
                variant="list-item-sidebar-ai-chat"
                language={props.language}
                data={data}
                dataSource="props"
                topic
                href={threadHref(data.id)}
                title={title}
                activityAt={data.lastMessageAt ?? data.createdAt}
                unreadCount={data.unreadCount}
                previewAuthor={previewAuthor}
                preview={
                  data.lastMessagePreview ||
                  (data.lastMessageHasFiles
                    ? ru
                      ? "Вложение"
                      : "Attachment"
                    : undefined)
                }
                selected={data.id === activeSocialModuleThreadId}
                onNavigate={closeNavigation}
                className={cn(
                  "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-foreground [&_svg]:text-muted-foreground",
                  data.id === activeSocialModuleThreadId &&
                    "bg-muted text-foreground",
                )}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="px-3 py-4 text-sm text-muted-foreground">
          {ru ? "Обсуждения не найдены" : "No matching threads"}
        </p>
      )}
    </ChatWorkspaceNavigation>
  ) : (
    <Subject
      isServer={false}
      variant="social-module-profile-chat-list-default"
      data={props.data}
      language={props.language}
      socialModuleProfile={props.socialModuleProfile}
      includeSubjectProfiles
      currentSocialModuleChatId={props.socialModuleChat.id}
      compact
      currentChatActions={!hasMultipleThreads && settingsButton}
      onSelectCurrentChat={selectCurrentChat}
    />
  );
  const navigationTrigger = (
    <button
      type="button"
      aria-label={navigationLabel}
      aria-controls={mobileNavigationId}
      aria-expanded={navigationOpen}
      onClick={() => setMobileNavigation({ href: navigationHref, open: true })}
      className={cn(navigationButtonClassName, "lg:hidden")}
    >
      <ArrowLeft className="size-5" aria-hidden="true" />
    </button>
  );

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("w-full min-w-0", props.className)}
    >
      <ChatWorkspace
        siteLayout
        className={embedded ? "h-[clamp(32rem,70dvh,48rem)]" : undefined}
        navigation={navigation}
        navigationId={mobileNavigationId}
        navigationClassName={cn(
          "w-full flex-col overflow-hidden bg-card p-0 text-card-foreground lg:flex lg:w-80 lg:border-r lg:border-border",
          navigationOpen && "flex",
        )}
      >
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col lg:flex",
            navigationOpen ? "hidden" : "flex",
          )}
        >
          {activeSocialModuleThreadId && activeSocialModuleThread ? (
            <Subject
              key={activeSocialModuleThreadId}
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
              supportHref={supportHref}
              variant="social-module-profile-chat-message-list-default"
              navigation={navigationTrigger}
              profileOpenRef={profileOpenRef}
            />
          ) : socialModuleThreadsIsLoading ||
            (lookupRequestedThread && requestedThread.isLoading) ? (
            <ChatThreadSkeleton />
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
                    {socialModuleThreadsIsError
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
        </div>
      </ChatWorkspace>
      {showSettings && !accessDenied ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowSettings(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={settingsLabel}
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
            <div className="flex shrink-0 border-b border-border">
              {[
                {
                  key: "general" as const,
                  label: ru ? "Основное" : "General",
                },
                {
                  key: "threads" as const,
                  label: `${ru ? "Обсуждения" : "Threads"} (${threadItems.length})`,
                },
                {
                  key: "members" as const,
                  label: `${ru ? "Участники" : "Members"} (${membersCount})`,
                },
              ]
                .filter((tab) => canManageChat || tab.key === "members")
                .map((tab) => {
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
              {canManageChat && settingsTab === "general" ? (
                <Form {...chatSettingsForm}>
                  <div className="space-y-5">
                    <ImageUploadField
                      language={props.language}
                      label={ru ? "Обложка" : "Cover"}
                      chooseLabel={
                        ru ? "Выбрать обложку чата" : "Choose chat cover"
                      }
                      savedLabel={ru ? "Обложка сохранена" : "Cover saved"}
                      pending={socialModuleChatFindByIdUpdate.isPending}
                      canRemove={Boolean(coverProps)}
                      preview={coverProps && <ChatCover {...coverProps} />}
                      onSave={saveCover}
                    />
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
              {canManageChat && settingsTab === "threads" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newThreadTitle}
                      maxLength={embedded ? 120 : undefined}
                      disabled={creatingThread}
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
                      disabled={!newThreadTitle.trim() || creatingThread}
                      className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-[11px] text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      {ru ? "Создать" : "Create"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {threadItems.length ? (
                      threadItems.map((threadItem) => {
                        const canEditThread =
                          canManageChat &&
                          threadItem.data.variant !== SUPPORT_THREAD_VARIANT;
                        const renameLabel = ru
                          ? `Переименовать обсуждение «${threadItem.title}»`
                          : `Rename thread ${threadItem.title}`;
                        const deleteLabel = ru
                          ? `Удалить обсуждение «${threadItem.title}»`
                          : `Delete thread ${threadItem.title}`;
                        const isDeletingThread =
                          threadDeletionIntent?.id === threadItem.data.id &&
                          socialModuleChatFindByIdThreadDelete.isPending;
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
                            {canEditThread && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditThreadTitle(threadItem.title);
                                    setEditingThreadId(threadItem.data.id);
                                  }}
                                  aria-label={renameLabel}
                                  title={renameLabel}
                                  className="size-10 shrink-0 rounded-xl text-muted-foreground active:bg-accent/80 active:text-accent-foreground"
                                >
                                  <Edit3
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                </Button>
                                {threadItem.canDelete && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (
                                        socialModuleChatFindByIdThreadDelete.isPending
                                      ) {
                                        return;
                                      }
                                      setThreadDeletionIntent({
                                        id: threadItem.data.id,
                                        title: threadItem.title,
                                      });
                                    }}
                                    aria-label={deleteLabel}
                                    title={deleteLabel}
                                    disabled={isDeletingThread}
                                    aria-busy={isDeletingThread}
                                    className="size-10 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 active:text-destructive"
                                  >
                                    <Trash2
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                )}
                              </>
                            )}
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
                      placeholder={ru ? "Поиск участников" : "Search users..."}
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
                        <span className="sr-only">
                          {ru
                            ? "Очистить поиск участников"
                            : "Clear member search"}
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-[11px] text-slate-400">
                      {ru ? "Участники" : "Members"} ({membersCount})
                    </h4>
                    <div className="space-y-1">
                      {filteredMemberItems.length ? (
                        filteredMemberItems.map((profileItem) => {
                          const isCurrentProfile =
                            profileItem.profile.id ===
                            props.socialModuleProfile.id;

                          const canRemove =
                            canManageMembers &&
                            membersCount > 1 &&
                            !props.socialModuleChat.protectedProfileIds?.includes(
                              profileItem.profile.id,
                            );
                          return (
                            <div
                              key={profileItem.profile.id}
                              className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-slate-50"
                            >
                              <div className="min-w-0 flex-1">
                                {activeSocialModuleThread ? (
                                  <ChatParticipantButton
                                    language={props.language}
                                    profile={profileItem.profile}
                                    presentation={props.socialModuleChat.participantPresentations?.find(
                                      ({ id }) => id === profileItem.profile.id,
                                    )}
                                    subtitle={profileItem.subtitle}
                                    onProfileOpen={openMemberProfile}
                                  />
                                ) : (
                                  <span>{profileItem.title}</span>
                                )}
                              </div>
                              {isCurrentProfile ? (
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                    {ru ? "Вы" : "You"}
                                  </span>
                                  {canRemove && (
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
                                      <span className="sr-only">
                                        {ru ? "Выйти из чата" : "Leave chat"}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ) : canRemove ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfileRemovalIntent({
                                      item: profileItem,
                                      mode: "remove",
                                    });
                                  }}
                                  title={
                                    ru ? "Удалить участника" : "Remove member"
                                  }
                                  disabled={
                                    socialModuleChatFindByIdProfileDelete.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {ru ? "Удалить участника" : "Remove member"}
                                  </span>
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {memberSearch
                            ? ru
                              ? "Участники не найдены"
                              : "No matching members"
                            : ru
                              ? "Участников пока нет"
                              : "No members found"}
                        </p>
                      )}
                    </div>
                  </div>
                  {canManageMembers && memberSearch.trim() ? (
                    <div className="border-t border-slate-200 pt-3">
                      <h4 className="mb-1.5 text-[11px] text-slate-400">
                        {ru ? "Профили" : "User profiles"}
                      </h4>
                      {!canSearchProfiles ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru
                            ? "Введите не меньше двух символов для поиска."
                            : "Type at least 2 characters to search users."}
                        </p>
                      ) : searchedSocialModuleProfilesIsLoading ||
                        searchedSocialModuleProfilesIsFetching ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru ? "Ищем профили…" : "Searching users..."}
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
                                  title={
                                    ru ? "Добавить участника" : "Add member"
                                  }
                                  disabled={
                                    isAdding ||
                                    socialModuleChatFindByIdProfileCreate.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {ru ? "Добавить участника" : "Add member"}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru ? "Профили не найдены" : "No users found"}
                        </p>
                      )}
                      <h4 className="mb-1.5 mt-3 text-[11px] text-slate-400">
                        {ru ? "Агенты" : "Agents"}
                      </h4>
                      {!canSearchProfiles ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru
                            ? "Введите не меньше двух символов для поиска."
                            : "Type at least 2 characters to search agents."}
                        </p>
                      ) : searchedAgentSubjectsIsLoading ||
                        searchedAgentSubjectsIsFetching ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru ? "Ищем агентов…" : "Searching agents..."}
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
                                    {ru ? "Агент" : "Agent subject"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddAgentSubject(agentSubjectItem);
                                  }}
                                  title={ru ? "Добавить агента" : "Add agent"}
                                  disabled={
                                    isAdding ||
                                    socialModuleChatFindByIdProfileCreate.isPending
                                  }
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {ru ? "Добавить агента" : "Add agent"}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          {ru ? "Агенты не найдены" : "No agents found"}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {canManageChat && settingsTab === "general" ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
                {standardChat && (
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
                    {ru ? "Удалить чат" : "Delete chat"}
                  </button>
                )}
                <SaveChatSettings
                  control={chatSettingsForm.control}
                  pending={socialModuleChatFindByIdUpdate.isPending}
                  onSave={handleSaveChatSettings}
                  language={props.language}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {canManageChat && standardChat && isChatDeleteConfirmOpen ? (
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
                <span className="sr-only">
                  {ru ? "Закрыть подтверждение" : "Close confirmation"}
                </span>
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
                {ru ? "Отмена" : "Cancel"}
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
      {canManageMembers && profileRemovalIntent ? (
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
                  ? ru
                    ? "Выйти из чата"
                    : "Leave chat"
                  : ru
                    ? "Удалить участника"
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
                <span className="sr-only">
                  {ru ? "Закрыть подтверждение" : "Close confirmation"}
                </span>
              </button>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {profileRemovalIntent.mode === "leave"
                ? ru
                  ? `Выйти из чата «${chatDisplayTitle}»?`
                  : `Leave ${chatDisplayTitle}?`
                : ru
                  ? `Удалить ${profileRemovalIntent.item.title} из чата?`
                  : `Remove ${profileRemovalIntent.item.title} from this chat?`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileRemovalIntent(null);
                }}
                disabled={socialModuleChatFindByIdProfileDelete.isPending}
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ru ? "Отмена" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveProfile}
                disabled={socialModuleChatFindByIdProfileDelete.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
              >
                {socialModuleChatFindByIdProfileDelete.isPending
                  ? ru
                    ? "Сохранение…"
                    : "Saving…"
                  : profileRemovalIntent.mode === "leave"
                    ? ru
                      ? "Выйти"
                      : "Leave chat"
                    : ru
                      ? "Удалить"
                      : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {canManageChat && threadDeletionIntent ? (
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
                {ru ? "Удалить обсуждение" : "Delete thread"}
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
                <span className="sr-only">
                  {ru ? "Закрыть подтверждение" : "Close confirmation"}
                </span>
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {ru
                ? `Удалить обсуждение «${threadDeletionIntent.title}» и его сообщения?`
                : `Delete ${threadDeletionIntent.title} and its messages?`}
              {props.socialModuleChat.variant === "telegram" &&
                (ru
                  ? " Связанная тема Telegram тоже будет удалена."
                  : " The linked Telegram topic will also be deleted.")}
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
                {ru ? "Отмена" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteThread}
                disabled={socialModuleChatFindByIdThreadDelete.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
              >
                {socialModuleChatFindByIdThreadDelete.isPending
                  ? ru
                    ? "Удаление…"
                    : "Deleting..."
                  : ru
                    ? "Удалить обсуждение"
                    : "Delete thread"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {canManageChat && editingThreadId ? (
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
                {ru ? "Переименовать обсуждение" : "Edit Thread"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingThreadId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">
                  {ru ? "Закрыть" : "Close editor"}
                </span>
              </button>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">
                {ru ? "Название" : "Title"}
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
                {ru ? "Отмена" : "Cancel"}
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
                {ru ? "Сохранить" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SaveChatSettings({
  control,
  pending,
  onSave,
  language,
}: {
  control: Control<ChatSettingsFormValues>;
  pending: boolean;
  onSave: () => void;
  language: string;
}) {
  const title = useWatch({ control, name: "title" });
  const ru = language === "ru";
  return (
    <Button
      type="button"
      onClick={onSave}
      className="ml-auto"
      disabled={pending || !hasLocalizedText(title)}
    >
      {pending ? (ru ? "Сохранение…" : "Saving…") : ru ? "Сохранить" : "Save"}
    </Button>
  );
}
