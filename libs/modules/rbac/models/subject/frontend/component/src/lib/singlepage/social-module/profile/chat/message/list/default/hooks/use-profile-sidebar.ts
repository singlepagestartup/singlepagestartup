"use client";

import { KnowledgeSource, KnowledgeSourceDraft, SocialSkill } from "../types";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/client";
import { route as rbacSubjectRoute } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import type {
  IModel as ISocialModuleProfile,
  TSupportedMcpServerIdentifier,
} from "@sps/social/models/profile/sdk/model";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseProfileSidebarProps {
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
}

export type ProfileSidebarProfileUpdateValues = {
  adminTitle?: string;
  title?: Record<string, string | undefined>;
  subtitle?: Record<string, string | undefined>;
  description?: Record<string, string | undefined>;
  allowedMcpServerIds?: TSupportedMcpServerIdentifier[];
  avatarFile?: File | null;
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
  const [selectedProfile, setSelectedProfile] =
    useState<ISocialModuleProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
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
  const [knowledgeSourcesNeedingReindex, setKnowledgeSourcesNeedingReindex] =
    useState<Record<string, boolean>>({});
  const [reindexingKnowledgeSourceId, setReindexingKnowledgeSourceId] =
    useState<string | null>(null);
  const selectedProfileId = selectedProfile?.id;
  const canManageSelectedProfile = Boolean(
    selectedProfileId && selectedProfile?.variant === "artificial-intelligence",
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
    data: skillsQuery,
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

  const skills = useMemo(() => {
    return (skillsQuery || []) as SocialSkill[];
  }, [skillsQuery]);

  const profileSkillIds = useMemo(() => {
    return skills.map((skill) => {
      return skill.id;
    });
  }, [skills]);

  const {
    data: knowledgeSourcesQuery,
    isError: hasKnowledgeSourcesError,
    isLoading: isKnowledgeSourcesLoading,
    refetch: refetchKnowledgeSources,
  } = rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
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

  const knowledgeSources = useMemo(() => {
    const documents = (knowledgeSourcesQuery || []) as KnowledgeSource[];

    if (
      createdKnowledgeSource &&
      !documents.some((document) => document.id === createdKnowledgeSource.id)
    ) {
      return [...documents, createdKnowledgeSource];
    }

    return documents;
  }, [createdKnowledgeSource, knowledgeSourcesQuery]);

  const isCreatingKnowledgeSource =
    selectedKnowledgeSourceId === newKnowledgeSourceId;
  const selectedKnowledgeSource = useMemo(() => {
    if (isCreatingKnowledgeSource) {
      return createDraftKnowledgeSource();
    }

    return knowledgeSources.find((document) => {
      return document.id === selectedKnowledgeSourceId;
    });
  }, [isCreatingKnowledgeSource, knowledgeSources, selectedKnowledgeSourceId]);
  const isKnowledgeSourceDirty = Boolean(
    selectedKnowledgeSource &&
      (knowledgeSourceDraft.title !== selectedKnowledgeSource.title ||
        knowledgeSourceDraft.content !== selectedKnowledgeSource.content),
  );
  const selectedKnowledgeSourceNeedsReindex = Boolean(
    selectedKnowledgeSource &&
      selectedKnowledgeSource.contentHash !==
        selectedKnowledgeSource.indexedContentHash,
  );

  const knowledgeSourceUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleSourceId:
          selectedKnowledgeSourceId || "missing-document",
      },
    );
  const knowledgeSourceReindex =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdReindex(
      {
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
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${selectedProfileId || "missing-profile"}/knowledge/sources`,
    ];
  }, [
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
    void queryClient.invalidateQueries({
      queryKey: knowledgeSourcesQueryKey,
    });

    if (canManageSelectedProfile) {
      void refetchKnowledgeSources();
    }
  }, [
    canManageSelectedProfile,
    knowledgeSourcesQueryKey,
    refetchKnowledgeSources,
  ]);

  const refetchProfileAvatarQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      predicate(query) {
        const queryKey = JSON.stringify(query.queryKey);

        return (
          queryKey.includes(
            "/api/social/profiles-to-file-storage-module-files",
          ) || queryKey.includes("/api/file-storage/files")
        );
      },
    });
  }, []);

  const openProfile = useCallback((profile: ISocialModuleProfile) => {
    setSelectedProfile(profile);
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
    setIsSidebarOpen(true);

    const shouldUseSheet =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1535px)").matches;

    setIsMobileSheetOpen(shouldUseSheet);
  }, []);

  function closeProfile() {
    setIsSidebarOpen(false);
    setIsMobileSheetOpen(false);
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
  }

  function selectKnowledgeSource(document: KnowledgeSource) {
    setCreatedKnowledgeSource(null);
    setSelectedKnowledgeSourceId(document.id);
    setKnowledgeSourceDraft({
      title: document.title,
      content: document.content,
    });
  }

  function createKnowledgeSource(profile: ISocialModuleProfile) {
    setSelectedProfile(profile);
    setSelectedKnowledgeSourceId(newKnowledgeSourceId);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
  }

  function closeKnowledgeSource() {
    setSelectedKnowledgeSourceId(null);
    setCreatedKnowledgeSource(null);
    setKnowledgeSourceDraft({
      title: "",
      content: "",
    });
  }

  async function saveProfile(values: ProfileSidebarProfileUpdateValues) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      return;
    }

    const { avatarFile, ...profileValues } = values;

    try {
      const updatedProfile = await profileUpdate.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        data: profileValues,
      });

      setSelectedProfile(updatedProfile);

      if (avatarFile) {
        await profileAvatarUpdate.mutateAsync({
          id: props.subjectId,
          socialModuleProfileId: props.socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          targetSocialModuleProfileId: selectedProfileId,
          data: {
            file: avatarFile,
          },
        });
        refetchProfileAvatarQueries();
      }

      toast.success("Profile saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save profile");
    }
  }

  function saveKnowledgeSource(document: KnowledgeSource) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      return;
    }

    const title = knowledgeSourceDraft.title.trim() || document.title;

    if (document.id === newKnowledgeSourceId) {
      const content = knowledgeSourceDraft.content.trim();

      if (!title || !content) {
        toast.error("Knowledge title and content are required");
        return;
      }

      knowledgeSourceCreate.mutate(
        {
          id: props.subjectId,
          socialModuleProfileId: props.socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          targetSocialModuleProfileId: selectedProfileId,
          data: {
            title,
            content,
            orderIndex: knowledgeSources.length,
          },
        },
        {
          onSuccess(createdDocument) {
            toast.success("Knowledge Source created");
            setCreatedKnowledgeSource(createdDocument);
            setSelectedKnowledgeSourceId(createdDocument.id);
            setKnowledgeSourceDraft({
              title: createdDocument.title,
              content: createdDocument.content,
            });
            refetchKnowledgeSourceQueries();
          },
        },
      );

      return;
    }

    knowledgeSourceUpdate.mutate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleSourceId: document.id,
        data: {
          title,
          content: knowledgeSourceDraft.content,
        },
      },
      {
        onSuccess(updatedDocument) {
          toast.success("Knowledge Source saved");
          setSelectedKnowledgeSourceId(updatedDocument.id);
          setKnowledgeSourcesNeedingReindex((current) => {
            return {
              ...current,
              [updatedDocument.id]:
                updatedDocument.contentHash !==
                updatedDocument.indexedContentHash,
            };
          });
          setKnowledgeSourceDraft({
            title: updatedDocument.title,
            content: updatedDocument.content,
          });
          refetchKnowledgeSourceQueries();
        },
      },
    );
  }

  async function reindexKnowledgeSource(document: KnowledgeSource) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      return;
    }

    setReindexingKnowledgeSourceId(document.id);

    try {
      await knowledgeSourceReindex.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleSourceId: document.id,
      });
      toast.success("Knowledge Source reindexed");
      setKnowledgeSourcesNeedingReindex((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      refetchKnowledgeSourceQueries();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reindex Knowledge Source");
    } finally {
      setReindexingKnowledgeSourceId(null);
    }
  }

  async function deleteKnowledgeSource(
    document: KnowledgeSource,
    unlink = false,
  ) {
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
        ...(unlink ? { unlink: true } : {}),
      });
      toast.success(unlink ? "Source unlinked from profile" : "Source deleted");
      setSelectedKnowledgeSourceId(null);
      setCreatedKnowledgeSource(null);
      setKnowledgeSourcesNeedingReindex((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      setKnowledgeSourceDraft({
        title: "",
        content: "",
      });
      refetchKnowledgeSourceQueries();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete Knowledge Source");
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
    closeKnowledgeSource,
    closeProfile,
    hasKnowledgeSourcesError:
      canManageSelectedProfile && hasKnowledgeSourcesError,
    isKnowledgeSourcesLoading:
      canManageSelectedProfile && isKnowledgeSourcesLoading,
    isKnowledgeSourceDirty,
    isMobileSheetOpen,
    isSidebarOpen,
    isCreatingKnowledgeSource,
    isSavingKnowledgeSource:
      knowledgeSourceUpdate.isPending || knowledgeSourceCreate.isPending,
    isDeletingKnowledgeSource: knowledgeSourceDelete.isPending,
    isReindexingKnowledgeSource: Boolean(
      selectedKnowledgeSource &&
        reindexingKnowledgeSourceId === selectedKnowledgeSource.id,
    ),
    isSavingProfile: profileUpdate.isPending || profileAvatarUpdate.isPending,
    isSkillsLoading: canManageSelectedProfile && isSkillsLoading,
    knowledgeSourceDraft,
    knowledgeSources: canManageSelectedProfile ? knowledgeSources : [],
    onKnowledgeSourceDraftChange: setKnowledgeSourceDraft,
    onKnowledgeSourceCreate: createKnowledgeSource,
    onKnowledgeSourceDelete: deleteKnowledgeSource,
    onKnowledgeSourceUnlink: (source: KnowledgeSource) =>
      deleteKnowledgeSource(source, true),
    onKnowledgeSourceReindex: reindexKnowledgeSource,
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
    setIsMobileSheetOpen,
    skills: canManageSelectedProfile ? skills : [],
  };
}
