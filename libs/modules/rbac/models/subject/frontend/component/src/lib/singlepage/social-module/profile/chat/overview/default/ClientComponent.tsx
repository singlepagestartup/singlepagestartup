"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatMessageListDefault } from "../../message/list/default";
import {
  emptyLocalizedTextFields,
  getLocalizedText,
  hasLocalizedText,
  type LocalizedTextFields,
  normalizeLocalizedTextFields,
} from "../../title";
import { api, queryClient } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/client";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/client";
import { route as socialModuleProfilesToChatsRoute } from "@sps/social/relations/profiles-to-chats/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { Form } from "@sps/shared-ui-shadcn";
import {
  ChevronLeft,
  Edit3,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MobilePanel = "threads" | "messages";
type SettingsTab = "general" | "threads" | "members";

type ProfileListItem = {
  profile: ISocialModuleProfile;
  title: string;
  subtitle: string;
  initial: string;
  searchText: string;
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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("messages");
  const [threadSearch, setThreadSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [pendingAddProfileId, setPendingAddProfileId] = useState<string | null>(
    null,
  );
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
    data: socialModuleProfilesToChats,
    isLoading: socialModuleProfilesToChatsIsLoading,
    refetch: refetchSocialModuleProfilesToChats,
  } = socialModuleProfilesToChatsApi.find({
    params: {
      filters: {
        and: [
          {
            column: "chatId",
            method: "eq",
            value: props.socialModuleChat.id,
          },
        ],
      },
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
  const {
    data: socialModuleThreads,
    isLoading: socialModuleThreadsIsLoading,
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

    if (requestedThread?.id) {
      return requestedThread.id;
    }

    const defaultThread = socialModuleThreads.find((socialModuleThread) => {
      return socialModuleThread.variant === "default";
    });

    if (defaultThread?.id) {
      return defaultThread.id;
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
    if (!activeSocialModuleThreadId) {
      return;
    }

    if (props.socialModuleThreadId === activeSocialModuleThreadId) {
      return;
    }

    router.replace(
      `/social/chats/${props.socialModuleChat.id}/threads/${activeSocialModuleThreadId}`,
    );
  }, [
    activeSocialModuleThreadId,
    props.socialModuleChat.id,
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

  const activeThreadIndex = useMemo(() => {
    if (!activeSocialModuleThreadId || !socialModuleThreads?.length) {
      return -1;
    }

    return socialModuleThreads.findIndex((socialModuleThread) => {
      return socialModuleThread.id === activeSocialModuleThreadId;
    });
  }, [activeSocialModuleThreadId, socialModuleThreads]);

  const threadItems = useMemo(() => {
    return (socialModuleThreads || []).map((socialModuleThread, index) => {
      const title =
        socialModuleThread.title?.trim() ||
        (socialModuleThread.variant === "default"
          ? "Default thread"
          : `Thread ${index + 1}`);

      return {
        data: socialModuleThread,
        title,
        createdAt: new Date(socialModuleThread.createdAt).toLocaleDateString(),
        preview:
          socialModuleThread.variant === "default"
            ? "Primary conversation thread"
            : "Conversation thread",
        shortId: socialModuleThread.id.slice(0, 8),
      };
    });
  }, [socialModuleThreads]);
  const activeThreadTitle =
    activeThreadIndex >= 0
      ? threadItems[activeThreadIndex]?.title || "Select a thread"
      : "Select a thread";
  const filteredThreadItems = useMemo(() => {
    const normalizedSearch = threadSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return threadItems;
    }

    return threadItems.filter((threadItem) => {
      return [
        threadItem.title,
        threadItem.preview,
        threadItem.shortId,
        threadItem.data.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [threadItems, threadSearch]);
  const memberProfileIds = useMemo(() => {
    return new Set(
      (socialModuleProfilesToChats || [])
        .map((socialModuleProfileToChat) => {
          return socialModuleProfileToChat.profileId;
        })
        .filter((profileId): profileId is string => Boolean(profileId)),
    );
  }, [socialModuleProfilesToChats]);
  const memberProfileIdsArray = useMemo(() => {
    return Array.from(memberProfileIds);
  }, [memberProfileIds]);
  const {
    data: socialModuleMemberProfiles,
    isLoading: socialModuleMemberProfilesIsLoading,
  } = socialModuleProfileApi.find({
    params: {
      limit: Math.max(memberProfileIdsArray.length, 1),
      filters: {
        and: [
          {
            column: "id",
            method: "inArray",
            value: memberProfileIdsArray,
          },
        ],
      },
      orderBy: {
        and: [
          {
            column: "slug",
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
    reactQueryOptions: {
      enabled: memberProfileIdsArray.length > 0,
    },
  });
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
  const chatTitleValues = chatSettingsForm.watch("title");
  const chatDisplayTitle = getLocalizedText(
    chatTitleValues,
    props.language,
    "Untitled chat",
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
    void queryClient.invalidateQueries({
      queryKey: [socialModuleProfilesToChatsRoute],
    });
    void refetchSocialModuleProfilesToChats();
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
          toast.success("Chat settings saved successfully");
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
            router.push("/social/chats");
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
          toast.success("Chat deleted");
          router.push("/social/chats");
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
          setMobilePanel("messages");
          void refetchSocialModuleThreads();
          toast.success("Thread created successfully");

          if (data?.id) {
            router.push(
              `/social/chats/${props.socialModuleChat.id}/threads/${data.id}`,
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
          toast.success("Thread renamed successfully");
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
          toast.success("Thread deleted successfully");

          if (activeSocialModuleThreadId === deletedThreadId) {
            const nextThread =
              remainingThreadItems.find((threadItem) => {
                return threadItem.data.variant === "default";
              }) || remainingThreadItems[0];

            if (nextThread?.data.id) {
              router.push(
                `/social/chats/${props.socialModuleChat.id}/threads/${nextThread.data.id}`,
              );
            } else {
              router.push(`/social/chats/${props.socialModuleChat.id}`);
            }
          }
        },
      },
    );
  };

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-[calc(100vh-4rem)] min-h-0 w-full flex-col overflow-hidden bg-white",
        props.className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "min-h-0 border-r border-slate-200 bg-white md:flex md:w-1/3 md:flex-none md:flex-col",
            mobilePanel === "threads" ? "flex flex-col" : "hidden",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-slate-950">
                {chatDisplayTitle}
              </h2>
              <p className="truncate text-xs text-slate-500">
                {socialModuleThreadsIsLoading
                  ? "Loading threads"
                  : `${socialModuleThreads?.length || 0} thread${
                      socialModuleThreads?.length === 1 ? "" : "s"
                    }`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsTab("general");
                setShowSettings(true);
              }}
              title="Chat settings"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Chat settings</span>
            </button>
          </div>
          <div className="border-b border-slate-100 px-3 py-3">
            <label
              htmlFor={`thread-search-${props.socialModuleChat.id}`}
              className="sr-only"
            >
              Search threads
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={`thread-search-${props.socialModuleChat.id}`}
                value={threadSearch}
                onChange={(event) => {
                  setThreadSearch(event.target.value);
                }}
                placeholder="Search threads"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {socialModuleThreadsIsLoading ? (
              <div className="p-4 text-sm text-slate-500">
                Loading threads...
              </div>
            ) : filteredThreadItems.length ? (
              filteredThreadItems.map((threadItem) => {
                const socialModuleThread = threadItem.data;
                const isActive =
                  socialModuleThread.id === activeSocialModuleThreadId;

                return (
                  <button
                    key={socialModuleThread.id}
                    type="button"
                    onClick={() => {
                      setMobilePanel("messages");
                      router.push(
                        `/social/chats/${props.socialModuleChat.id}/threads/${socialModuleThread.id}`,
                      );
                    }}
                    className={cn(
                      "w-full border-b border-slate-100 px-4 py-3 text-left transition",
                      isActive ? "bg-slate-50" : "hover:bg-slate-50/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {threadItem.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {threadItem.createdAt}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs text-slate-500">
                        {threadItem.preview}
                      </p>
                      {isActive ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-sm text-slate-500">
                {threadSearch ? "No matching threads." : "No thread found."}
              </div>
            )}
          </div>
        </aside>
        {showSettings ? (
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
                    {membersCount} member{membersCount === 1 ? "" : "s"} ·{" "}
                    {threadItems.length} thread
                    {threadItems.length === 1 ? "" : "s"}
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
                  <span className="sr-only">Close settings</span>
                </button>
              </div>
              <div className="flex shrink-0 border-b border-slate-200">
                {[
                  { key: "general" as const, label: "General" },
                  {
                    key: "threads" as const,
                    label: `Threads (${threadItems.length})`,
                  },
                  {
                    key: "members" as const,
                    label: `Members (${membersCount})`,
                  },
                ].map((tab) => {
                  return (
                    <button
                      key={tab.key}
                      type="button"
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
                          Name
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
                                placeholder="Type chat title"
                                labelClassName="mb-1 text-[11px] font-normal text-slate-400"
                                inputClassName="border-slate-200 bg-slate-50 text-sm text-slate-700"
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-500">
                          Description
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
                                placeholder="Type description"
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
                        placeholder="New thread name..."
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
                        Add
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
                                  Created {threadItem.createdAt}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditThreadTitle(threadItem.title);
                                  setEditingThreadId(threadItem.data.id);
                                }}
                                title="Edit thread"
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span className="sr-only">Edit thread</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setThreadDeletionIntent({
                                    id: threadItem.data.id,
                                    title: threadItem.title,
                                  });
                                }}
                                title="Delete thread"
                                disabled={
                                  socialModuleChatFindByIdThreadDelete.isPending
                                }
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Delete thread</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-6 text-center text-xs text-slate-400">
                          No threads yet
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
                        {socialModuleProfilesToChatsIsLoading ||
                        socialModuleMemberProfilesIsLoading ? (
                          <p className="py-4 text-center text-xs text-slate-400">
                            Loading profiles...
                          </p>
                        ) : filteredMemberItems.length ? (
                          filteredMemberItems.map((profileItem) => {
                            const isCurrentProfile =
                              profileItem.profile.id ===
                              props.socialModuleProfile.id;

                            return (
                              <div
                                key={profileItem.profile.id}
                                className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-slate-50"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
                                  {profileItem.initial}
                                </div>
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
                                      <span className="sr-only">
                                        Leave chat
                                      </span>
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
                                    <span className="sr-only">
                                      Remove member
                                    </span>
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
                          Search results
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
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 opacity-70">
                                    {profileItem.initial}
                                  </div>
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
                ? Messages in this thread will be removed from this chat. If it
                is linked to a Telegram topic, the topic will also be deleted.
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
        <section
          className={cn(
            "min-h-0 bg-white md:w-2/3 md:min-w-0 md:flex-none md:flex-col",
            mobilePanel === "messages" ? "flex flex-col" : "hidden",
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setMobilePanel("threads");
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Back to threads"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-medium text-slate-950">
                {activeThreadTitle}
              </h2>
              <p className="truncate text-xs text-slate-500">
                {activeSocialModuleThreadId
                  ? `Thread ${activeSocialModuleThreadId.slice(0, 8)}`
                  : "Waiting for a thread"}
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {!activeSocialModuleThreadId ? (
              <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
                <h3 className="text-sm font-medium text-slate-700">
                  {socialModuleThreadsIsLoading
                    ? "Loading threads"
                    : "No thread selected"}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  {socialModuleThreadsIsLoading
                    ? "Messages will appear after the active thread is resolved."
                    : "Create or select a thread to open the message timeline."}
                </p>
              </div>
            ) : (
              <SocialModuleProfileChatMessageListDefault
                isServer={false}
                data={props.data}
                language={props.language}
                socialModuleChat={props.socialModuleChat}
                socialModuleProfile={props.socialModuleProfile}
                socialModuleThreadId={activeSocialModuleThreadId}
                variant="social-module-profile-chat-message-list-default"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
