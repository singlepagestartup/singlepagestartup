"use client";

import { KnowledgeSource, KnowledgeSourceDraft, SocialSkill } from "../types";
import { readKnowledgeUserContext } from "@sps/shared-utils";
import { isChatAccessError, knowledgeWriteError } from "../utils";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/client";
import { route as rbacSubjectRoute } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import type {
  IModel as ISocialModuleProfile,
  TSupportedMcpServerIdentifier,
  IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface UseProfileSidebarProps {
  summaryOnly: boolean;
  employeeProfileId?: string;
  language?: string;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
}

export type ProfileSidebarProfileUpdateValues = {
  title?: Record<string, string | undefined>;
  subtitle?: Record<string, string | undefined>;
  description?: Record<string, string | undefined>;
  allowedMcpServerIds?: TSupportedMcpServerIdentifier[];
};

const newKnowledgeSourceId = "new-knowledge-source";

function createDraftKnowledgeSource(): KnowledgeSource {
  return {
    id: newKnowledgeSourceId,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    variant: "default",
    className: null,
    adminTitle: "New knowledge",
    slug: "new-knowledge",
    title: "",
    content: "",
    description: null,
    indexedContentHash: null,
    contentHash: "",
    lastIndexedAt: null,
  };
}

export function useProfileSidebar(props: UseProfileSidebarProps) {
  const ru = props.language === "ru";
  const [openedProfile, setSelectedProfile] =
    useState<ISocialModuleProfile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<IProfileAvatar | null>();
  const [selectedName, setSelectedName] = useState<string>();
  const openedProfileId = useRef<string | undefined>(undefined);
  const profileTrigger = useRef<HTMLButtonElement | null>(null);
  const editingSession = useRef(0);
  const originalRevision = useRef<
    Pick<KnowledgeSource, "title" | "contentHash"> | undefined
  >(undefined);
  const [selectedKnowledgeSourceId, setSelectedKnowledgeSourceId] = useState<
    string | null
  >(null);
  const [createdKnowledgeSource, setCreatedKnowledgeSource] =
    useState<KnowledgeSource | null>(null);
  const [knowledgeSourceDraft, setKnowledgeSourceDraft] =
    useState<KnowledgeSourceDraft>({
      title: "",
      content: "",
    });
  const [knowledgeError, setKnowledgeError] =
    useState<ReturnType<typeof knowledgeWriteError>>();

  const createRequest = useRef<{
    profileId: string;
    title: string;
    content: string;
    key: string;
  }>(undefined);
  const selectedProfile = openedProfile;
  const selectedProfileId = selectedProfile?.id;
  const isOwnPersonalProfile = Boolean(
    selectedProfileId === props.socialModuleProfileId &&
    selectedProfile &&
    ["default", "telegram"].includes(selectedProfile.variant),
  );
  const canManageSelectedProfile = Boolean(
    !props.summaryOnly &&
    selectedProfileId &&
    selectedProfile?.variant === "artificial-intelligence" &&
    (!props.employeeProfileId || selectedProfileId === props.employeeProfileId),
  );

  const profileUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
      },
    );
  const profileAvatarUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
      },
    );

  const {
    data: loadedSkills,
    error: skillsError,
    isLoading: isSkillsLoading,
    refetch: refetchSkills,
  } = rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
    {
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId: selectedProfileId || "missing-profile",
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
      reactQueryOptions: {
        enabled: canManageSelectedProfile,
      },
    },
  );

  const skillsQuery =
    canManageSelectedProfile && !isChatAccessError(skillsError)
      ? loadedSkills
      : undefined;
  const skills = useMemo(() => {
    return (skillsQuery || []) as SocialSkill[];
  }, [skillsQuery]);

  const profileSkillIds = useMemo(() => {
    return skills.map((skill) => {
      return skill.id;
    });
  }, [skills]);

  const assistantKnowledge =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        options: {
          headers: {
            "Cache-Control": "no-store",
          },
        },
        reactQueryOptions: {
          enabled: canManageSelectedProfile,
        },
      },
    );

  const personalKnowledge =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeSourceFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      personal: true,
      options: { headers: { "Cache-Control": "no-store" } },
      reactQueryOptions: { enabled: isOwnPersonalProfile },
    });
  const {
    data: loadedKnowledgeSources,
    error: knowledgeSourcesError,
    isError: hasKnowledgeSourcesError,
    isLoading: isKnowledgeSourcesLoading,
    refetch: refetchKnowledgeSources,
  } = isOwnPersonalProfile ? personalKnowledge : assistantKnowledge;
  const canReadKnowledge = isOwnPersonalProfile || canManageSelectedProfile;
  const hideKnowledgeSources = isChatAccessError(knowledgeSourcesError);
  const knowledgeSourcesQuery =
    !canReadKnowledge || hideKnowledgeSources
      ? undefined
      : loadedKnowledgeSources;
  const knowledgeSources = useMemo(() => {
    if (hideKnowledgeSources) return [];
    const documents = (knowledgeSourcesQuery || []) as KnowledgeSource[];

    if (
      createdKnowledgeSource &&
      !documents.some((document) => document.id === createdKnowledgeSource.id)
    ) {
      return [...documents, createdKnowledgeSource];
    }

    return documents;
  }, [createdKnowledgeSource, knowledgeSourcesQuery, hideKnowledgeSources]);

  const isCreatingKnowledgeSource =
    selectedKnowledgeSourceId === newKnowledgeSourceId;
  const selectedKnowledgeSource = useMemo(() => {
    if (hideKnowledgeSources) return undefined;
    if (isCreatingKnowledgeSource) {
      return createDraftKnowledgeSource();
    }

    return knowledgeSources.find((document) => {
      return document.id === selectedKnowledgeSourceId;
    });
  }, [
    hideKnowledgeSources,
    isCreatingKnowledgeSource,
    knowledgeSources,
    selectedKnowledgeSourceId,
  ]);
  const isKnowledgeSourceDirty = Boolean(
    selectedKnowledgeSource &&
    (knowledgeSourceDraft.title !== selectedKnowledgeSource.title ||
      knowledgeSourceDraft.content !== selectedKnowledgeSource.content),
  );
  const selectedKnowledgeSourceNeedsReindex = Boolean(
    selectedKnowledgeSource &&
    (!selectedKnowledgeSource.indexedContentHash ||
      selectedKnowledgeSource.contentHash !==
        selectedKnowledgeSource.indexedContentHash),
  );

  const personalScope = {
    id: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    personal: true,
  };
  const personalCreate =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeSourceCreate({
      ...personalScope,
      mute: true,
    });
  const personalUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeSourceFindByIdUpdate({
      ...personalScope,
      mute: true,
      knowledgeModuleSourceId: selectedKnowledgeSourceId || "missing-document",
    });
  const knowledgeSourceUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
      {
        mute: true,
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleSourceId:
          selectedKnowledgeSourceId || "missing-document",
      },
    );
  const knowledgeSourceDelete =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdDelete(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleSourceId:
          selectedKnowledgeSourceId || "missing-document",
      },
    );
  const knowledgeSourceCreate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceCreate(
      {
        mute: true,
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
      },
    );

  const skillQueryKey = useMemo(() => {
    return [
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${selectedProfileId || "missing-profile"}/skills`,
    ];
  }, [
    props.socialModuleChatId,
    props.socialModuleProfileId,
    props.subjectId,
    selectedProfileId,
  ]);

  const knowledgeSourcesQueryKey = useMemo(() => {
    return [
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.employeeProfileId || selectedProfileId || "missing-profile"}/knowledge/sources`,
    ];
  }, [
    props.employeeProfileId,
    props.socialModuleChatId,
    props.socialModuleProfileId,
    props.subjectId,
    selectedProfileId,
  ]);

  const refetchSkillQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: skillQueryKey,
    });

    if (canManageSelectedProfile) {
      void refetchSkills();
    }
  }, [canManageSelectedProfile, refetchSkills, skillQueryKey]);

  const refetchKnowledgeSourceQueries = useCallback(() => {
    if (!isOwnPersonalProfile) {
      void queryClient.invalidateQueries({
        queryKey: knowledgeSourcesQueryKey,
      });
    }

    if (canReadKnowledge) {
      void refetchKnowledgeSources();
    }
  }, [
    canReadKnowledge,
    isOwnPersonalProfile,
    knowledgeSourcesQueryKey,
    refetchKnowledgeSources,
  ]);

  const refetchChatProfileQueries = useCallback(() => {
    const chatsPath = `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats`;
    const chatPath = `${chatsPath}/${props.socialModuleChatId}`;
    void queryClient.invalidateQueries({
      predicate: ({ queryKey: [path] }) =>
        typeof path === "string" &&
        (path === chatsPath ||
          path === chatPath ||
          (path.startsWith(`${chatPath}/threads/`) &&
            path.endsWith("/messages"))),
    });
  }, [props.subjectId, props.socialModuleProfileId, props.socialModuleChatId]);

  const refetchProfileAvatarQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      predicate(query) {
        const queryKey = JSON.stringify(query.queryKey);

        return (
          queryKey.includes(
            "/api/social/profiles-to-file-storage-module-files",
          ) ||
          queryKey.includes("/api/social/profiles/authors") ||
          queryKey.includes("/api/file-storage/files")
        );
      },
    });
  }, []);

  const openProfile = useCallback(
    (
      profile: ISocialModuleProfile,
      trigger: HTMLButtonElement,
      avatar?: IProfileAvatar | null,
      displayName?: string,
    ) => {
      editingSession.current++;
      setKnowledgeError(undefined);
      openedProfileId.current = profile.id;
      setSelectedName(displayName);
      profileTrigger.current = trigger;
      setSelectedAvatar(avatar);
      setSelectedProfile(profile);
      setSelectedKnowledgeSourceId(null);
      setCreatedKnowledgeSource(null);
      setKnowledgeSourceDraft({
        title: "",
        content: "",
      });
    },
    [],
  );

  const closeProfile = useCallback(() => {
    editingSession.current++;
    setKnowledgeError(undefined);
    openedProfileId.current = undefined;
    setSelectedProfile(null);
    setSelectedAvatar(undefined);
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
  }, []);

  function selectKnowledgeSource(document: KnowledgeSource) {
    editingSession.current++;
    setKnowledgeError(undefined);
    originalRevision.current = {
      title: document.title,
      contentHash: document.contentHash,
    };
    setCreatedKnowledgeSource(null);
    setSelectedKnowledgeSourceId(document.id);
    setKnowledgeSourceDraft({
      title: document.title,
      content: document.content,
    });
  }

  function createKnowledgeSource(profile: ISocialModuleProfile) {
    editingSession.current++;
    setKnowledgeError(undefined);
    createRequest.current = undefined;
    setSelectedProfile(profile);
    setSelectedKnowledgeSourceId(newKnowledgeSourceId);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
  }

  function closeKnowledgeSource() {
    editingSession.current++;
    setKnowledgeError(undefined);
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
  }

  async function saveProfile(values: ProfileSidebarProfileUpdateValues) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      throw new Error(
        ru
          ? "Профиль недоступен для редактирования"
          : "Profile editing is unavailable",
      );
    }

    const updatedProfile = await profileUpdate.mutateAsync({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId: selectedProfileId,
      data: values,
    });

    setSelectedProfile((current) =>
      current?.id === selectedProfileId ? updatedProfile : current,
    );
    refetchChatProfileQueries();
  }

  async function saveAvatar(data: { file: File } | { reset: true }) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      throw new Error(
        ru
          ? "Профиль недоступен для редактирования"
          : "Profile editing is unavailable",
      );
    }

    const avatar = await profileAvatarUpdate.mutateAsync({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId: selectedProfileId,
      data,
    });
    if (openedProfileId.current === selectedProfileId)
      setSelectedAvatar(avatar.file);
    refetchProfileAvatarQueries();
    refetchChatProfileQueries();
  }

  async function saveKnowledgeSource(
    document: KnowledgeSource,
    files?: File[],
    removeFileIds?: string[],
    onSaved?: () => void,
  ) {
    const creating = document.id === newKnowledgeSourceId;
    if (
      !selectedProfileId ||
      !canReadKnowledge ||
      (isOwnPersonalProfile && !creating && !document.editable)
    ) {
      return;
    }

    const title = knowledgeSourceDraft.title.trim();
    const content = knowledgeSourceDraft.content;
    if (!title || !content.trim()) {
      toast.error(
        ru
          ? "Заполните название и текст источника."
          : "Knowledge title and content are required",
      );
      return;
    }

    const session = editingSession.current;
    const chatScope = {
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId: selectedProfileId,
    };
    setKnowledgeError(undefined);
    const onError = (error: unknown) => {
      if (editingSession.current !== session) return;
      const result = knowledgeWriteError(error, ru, creating);
      setKnowledgeError(result);
      if (result.status === 409) {
        if (creating) createRequest.current = undefined;
        else void refetchKnowledgeSources();
      }
    };
    const onSuccess = (saved: KnowledgeSource) => {
      if (creating) {
        toast.success(
          ru ? "Источник знаний создан" : "Knowledge Source created",
        );
      } else {
        toast.success(
          ru ? "Источник знаний сохранён" : "Knowledge Source saved",
        );
      }
      if (editingSession.current !== session) return;
      onSaved?.();
      originalRevision.current = {
        title: saved.title,
        contentHash: saved.contentHash,
      };
      if (creating) {
        createRequest.current = undefined;
        setCreatedKnowledgeSource(saved);
      }
      setSelectedKnowledgeSourceId(saved.id);
      setKnowledgeSourceDraft({ title: saved.title, content: saved.content });
      refetchKnowledgeSourceQueries();
    };

    if (creating) {
      const text = content.trim();
      let request = createRequest.current;
      if (
        !request ||
        request.profileId !== selectedProfileId ||
        request.title !== title ||
        request.content !== text
      ) {
        request = {
          profileId: selectedProfileId,
          title,
          content: text,
          key: crypto.randomUUID(),
        };
        createRequest.current = request;
      }
      const data = {
        title,
        content: text,
        orderIndex: knowledgeSources.length,
        operationKey: request.key,
      };
      if (isOwnPersonalProfile) {
        personalCreate.mutate(
          { ...personalScope, data },
          { onSuccess, onError },
        );
      } else {
        knowledgeSourceCreate.mutate(
          {
            ...chatScope,
            data: { ...data, ...(files?.length ? { files } : {}) },
          },
          { onSuccess, onError },
        );
      }
      return;
    }

    if (isOwnPersonalProfile) {
      const revision = originalRevision.current;
      if (!revision) return;
      personalUpdate.mutate(
        {
          ...personalScope,
          knowledgeModuleSourceId: document.id,
          data: {
            title,
            content: readKnowledgeUserContext(content),
            expectedContentHash: revision.contentHash,
            expectedTitle: revision.title,
          },
        },
        { onSuccess, onError },
      );
    } else {
      knowledgeSourceUpdate.mutate(
        {
          ...chatScope,
          knowledgeModuleSourceId: document.id,
          data: {
            title,
            content: readKnowledgeUserContext(content),
            expectedContentHash: originalRevision.current?.contentHash,
            expectedTitle: originalRevision.current?.title,
            ...(files?.length ? { files } : {}),
            ...(removeFileIds?.length ? { removeFileIds } : {}),
          },
        },
        { onSuccess, onError },
      );
    }
  }

  async function deleteKnowledgeSource(document: KnowledgeSource) {
    if (
      !canManageSelectedProfile ||
      !selectedProfileId ||
      document.id === newKnowledgeSourceId
    ) {
      return;
    }

    try {
      await knowledgeSourceDelete.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleSourceId: document.id,
      });
      toast.success(ru ? "Источник удалён" : "Source deleted");
      setSelectedKnowledgeSourceId(null);
      setCreatedKnowledgeSource(null);
      setKnowledgeSourceDraft({
        title: "",
        content: "",
      });
      refetchKnowledgeSourceQueries();
    } catch {
      // The SDK already displayed the mutation error.
      return;
    }
  }

  useEffect(() => {
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
  }, [selectedProfileId]);

  useEffect(() => {
    if (!selectedKnowledgeSourceId) {
      return;
    }

    if (selectedKnowledgeSourceId === newKnowledgeSourceId) {
      return;
    }

    const selectedDocumentStillExists = knowledgeSources.some((document) => {
      return document.id === selectedKnowledgeSourceId;
    });

    if (!selectedDocumentStillExists) {
      setSelectedKnowledgeSourceId(null);
      setKnowledgeSourceDraft({
        title: "",
        content: "",
      });
    }
  }, [knowledgeSources, selectedKnowledgeSourceId]);

  return {
    canManageSelectedProfile,
    isOwnPersonalProfile,
    closeKnowledgeSource,
    closeProfile,
    hasKnowledgeSourcesError: canReadKnowledge && hasKnowledgeSourcesError,
    isKnowledgeSourcesLoading: canReadKnowledge && isKnowledgeSourcesLoading,
    isKnowledgeSourceDirty,
    profileTrigger,
    selectedAvatar,
    selectedName,
    isCreatingKnowledgeSource,
    isSavingKnowledgeSource: isOwnPersonalProfile
      ? personalCreate.isPending || personalUpdate.isPending
      : knowledgeSourceUpdate.isPending || knowledgeSourceCreate.isPending,
    isDeletingKnowledgeSource: knowledgeSourceDelete.isPending,
    isSavingProfile: profileUpdate.isPending,
    isSavingAvatar: profileAvatarUpdate.isPending,
    onAvatarSave: saveAvatar,
    isSkillsLoading: canManageSelectedProfile && isSkillsLoading,
    knowledgeSourceDraft,
    knowledgeError,
    knowledgeSources: canReadKnowledge ? knowledgeSources : [],
    onKnowledgeSourceDraftChange: setKnowledgeSourceDraft,
    onKnowledgeSourceCreate: createKnowledgeSource,
    onKnowledgeSourceDelete: deleteKnowledgeSource,
    onKnowledgeSourceSave: saveKnowledgeSource,
    onKnowledgeSourceSelect: selectKnowledgeSource,
    onProfileSave: saveProfile,
    openProfile,
    profileSkillIds,
    refetchKnowledgeSourceQueries,
    refetchSkillQueries,
    selectedKnowledgeSource,
    selectedKnowledgeSourceNeedsReindex,
    selectedProfile,
    skills: canManageSelectedProfile ? skills : [],
  };
}
