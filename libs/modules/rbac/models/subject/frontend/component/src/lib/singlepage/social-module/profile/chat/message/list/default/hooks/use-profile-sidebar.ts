"use client";

import {
  KnowledgeDocument,
  KnowledgeDocumentDraft,
  SocialSkill,
} from "../types";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/client";
import { route as rbacSubjectRoute } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
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
  avatarFile?: File | null;
};

const newKnowledgeDocumentId = "new-knowledge-document";

function createDraftKnowledgeDocument(): KnowledgeDocument {
  return {
    id: newKnowledgeDocumentId,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    variant: "default",
    className: null,
    adminTitle: "New knowledge",
    slug: "new-knowledge",
    title: "",
    description: "",
    status: "draft",
    summary: null,
    tags: [],
    metadata: {},
    contentHash: "",
    lastIndexedAt: null,
  };
}

export function useProfileSidebar(props: UseProfileSidebarProps) {
  const [selectedProfile, setSelectedProfile] =
    useState<ISocialModuleProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [selectedKnowledgeDocumentId, setSelectedKnowledgeDocumentId] =
    useState<string | null>(null);
  const [createdKnowledgeDocument, setCreatedKnowledgeDocument] =
    useState<KnowledgeDocument | null>(null);
  const [knowledgeDocumentDraft, setKnowledgeDocumentDraft] =
    useState<KnowledgeDocumentDraft>({
      title: "",
      description: "",
    });
  const [
    knowledgeDocumentsNeedingReindex,
    setKnowledgeDocumentsNeedingReindex,
  ] = useState<Record<string, boolean>>({});
  const [reindexingKnowledgeDocumentId, setReindexingKnowledgeDocumentId] =
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
    return ((skillsQuery || []) as SocialSkill[]).filter((skill) => {
      return skill.status !== "archived";
    });
  }, [skillsQuery]);

  const profileSkillIds = useMemo(() => {
    return skills.map((skill) => {
      return skill.id;
    });
  }, [skills]);

  const {
    data: knowledgeDocumentsQuery,
    isLoading: isKnowledgeDocumentsLoading,
    refetch: refetchKnowledgeDocuments,
  } = rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
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

  const knowledgeDocuments = useMemo(() => {
    const documents = (knowledgeDocumentsQuery || []) as KnowledgeDocument[];

    if (
      createdKnowledgeDocument &&
      !documents.some((document) => document.id === createdKnowledgeDocument.id)
    ) {
      return [...documents, createdKnowledgeDocument];
    }

    return documents;
  }, [createdKnowledgeDocument, knowledgeDocumentsQuery]);

  const isCreatingKnowledgeDocument =
    selectedKnowledgeDocumentId === newKnowledgeDocumentId;
  const selectedKnowledgeDocument = useMemo(() => {
    if (isCreatingKnowledgeDocument) {
      return createDraftKnowledgeDocument();
    }

    return knowledgeDocuments.find((document) => {
      return document.id === selectedKnowledgeDocumentId;
    });
  }, [
    isCreatingKnowledgeDocument,
    knowledgeDocuments,
    selectedKnowledgeDocumentId,
  ]);
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
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleDocumentId:
          selectedKnowledgeDocumentId || "missing-document",
      },
    );
  const knowledgeDocumentReindex =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleDocumentId:
          selectedKnowledgeDocumentId || "missing-document",
      },
    );
  const knowledgeDocumentDelete =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId || "missing-profile",
        knowledgeModuleDocumentId:
          selectedKnowledgeDocumentId || "missing-document",
      },
    );
  const knowledgeDocumentCreate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate(
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

  const knowledgeDocumentsQueryKey = useMemo(() => {
    return [
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${selectedProfileId || "missing-profile"}/knowledge/documents`,
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

  const refetchKnowledgeDocumentQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: knowledgeDocumentsQueryKey,
    });

    if (canManageSelectedProfile) {
      void refetchKnowledgeDocuments();
    }
  }, [
    canManageSelectedProfile,
    knowledgeDocumentsQueryKey,
    refetchKnowledgeDocuments,
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
    setSelectedKnowledgeDocumentId(null);
    setCreatedKnowledgeDocument(null);
    setKnowledgeDocumentDraft({
      title: "",
      description: "",
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
    setSelectedKnowledgeDocumentId(null);
    setCreatedKnowledgeDocument(null);
  }

  function selectKnowledgeDocument(document: KnowledgeDocument) {
    setCreatedKnowledgeDocument(null);
    setSelectedKnowledgeDocumentId(document.id);
    setKnowledgeDocumentDraft({
      title: document.title,
      description: document.description,
    });
  }

  function createKnowledgeDocument(profile: ISocialModuleProfile) {
    setSelectedProfile(profile);
    setSelectedKnowledgeDocumentId(newKnowledgeDocumentId);
    setKnowledgeDocumentDraft({
      title: "",
      description: "",
    });
  }

  function closeKnowledgeDocument() {
    setSelectedKnowledgeDocumentId(null);
    setCreatedKnowledgeDocument(null);
    setKnowledgeDocumentDraft({
      title: "",
      description: "",
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

  function saveKnowledgeDocument(document: KnowledgeDocument) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      return;
    }

    const title = knowledgeDocumentDraft.title.trim() || document.title;

    if (document.id === newKnowledgeDocumentId) {
      const description = knowledgeDocumentDraft.description.trim();

      if (!title || !description) {
        toast.error("Knowledge title and content are required");
        return;
      }

      knowledgeDocumentCreate.mutate(
        {
          id: props.subjectId,
          socialModuleProfileId: props.socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          targetSocialModuleProfileId: selectedProfileId,
          data: {
            title,
            description,
            orderIndex: knowledgeDocuments.length,
            metadata: {
              socialModuleChatId: props.socialModuleChatId,
            },
          },
        },
        {
          onSuccess(createdDocument) {
            toast.success("Knowledge document created");
            setCreatedKnowledgeDocument(createdDocument);
            setSelectedKnowledgeDocumentId(createdDocument.id);
            setKnowledgeDocumentDraft({
              title: createdDocument.title,
              description: createdDocument.description,
            });
            refetchKnowledgeDocumentQueries();
          },
        },
      );

      return;
    }

    knowledgeDocumentUpdate.mutate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleDocumentId: document.id,
        data: {
          title,
          description: knowledgeDocumentDraft.description,
        },
      },
      {
        onSuccess(updatedDocument) {
          toast.success("Knowledge document saved");
          setSelectedKnowledgeDocumentId(updatedDocument.id);
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

  async function reindexKnowledgeDocument(document: KnowledgeDocument) {
    if (!canManageSelectedProfile || !selectedProfileId) {
      return;
    }

    setReindexingKnowledgeDocumentId(document.id);

    try {
      await knowledgeDocumentReindex.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleDocumentId: document.id,
      });
      toast.success("Knowledge document reindexed");
      setKnowledgeDocumentsNeedingReindex((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      refetchKnowledgeDocumentQueries();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reindex Knowledge document");
    } finally {
      setReindexingKnowledgeDocumentId(null);
    }
  }

  async function deleteKnowledgeDocument(document: KnowledgeDocument) {
    if (
      !canManageSelectedProfile ||
      !selectedProfileId ||
      document.id === newKnowledgeDocumentId
    ) {
      return;
    }

    try {
      await knowledgeDocumentDelete.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: selectedProfileId,
        knowledgeModuleDocumentId: document.id,
      });
      toast.success("Knowledge document deleted");
      setSelectedKnowledgeDocumentId(null);
      setCreatedKnowledgeDocument(null);
      setKnowledgeDocumentsNeedingReindex((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      setKnowledgeDocumentDraft({
        title: "",
        description: "",
      });
      refetchKnowledgeDocumentQueries();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete Knowledge document");
    }
  }

  useEffect(() => {
    setSelectedKnowledgeDocumentId(null);
    setCreatedKnowledgeDocument(null);
    setKnowledgeDocumentDraft({
      title: "",
      description: "",
    });
  }, [selectedProfileId]);

  useEffect(() => {
    if (!selectedKnowledgeDocumentId) {
      return;
    }

    if (selectedKnowledgeDocumentId === newKnowledgeDocumentId) {
      return;
    }

    const selectedDocumentStillExists = knowledgeDocuments.some((document) => {
      return document.id === selectedKnowledgeDocumentId;
    });

    if (!selectedDocumentStillExists) {
      setSelectedKnowledgeDocumentId(null);
      setKnowledgeDocumentDraft({
        title: "",
        description: "",
      });
    }
  }, [knowledgeDocuments, selectedKnowledgeDocumentId]);

  return {
    canManageSelectedProfile,
    closeKnowledgeDocument,
    closeProfile,
    isKnowledgeDocumentsLoading:
      canManageSelectedProfile && isKnowledgeDocumentsLoading,
    isKnowledgeDocumentDirty,
    isMobileSheetOpen,
    isSidebarOpen,
    isCreatingKnowledgeDocument,
    isSavingKnowledgeDocument:
      knowledgeDocumentUpdate.isPending || knowledgeDocumentCreate.isPending,
    isDeletingKnowledgeDocument: knowledgeDocumentDelete.isPending,
    isReindexingKnowledgeDocument: Boolean(
      selectedKnowledgeDocument &&
        reindexingKnowledgeDocumentId === selectedKnowledgeDocument.id,
    ),
    isSavingProfile: profileUpdate.isPending || profileAvatarUpdate.isPending,
    isSkillsLoading: canManageSelectedProfile && isSkillsLoading,
    knowledgeDocumentDraft,
    knowledgeDocuments: canManageSelectedProfile ? knowledgeDocuments : [],
    onKnowledgeDocumentDraftChange: setKnowledgeDocumentDraft,
    onKnowledgeDocumentCreate: createKnowledgeDocument,
    onKnowledgeDocumentDelete: deleteKnowledgeDocument,
    onKnowledgeDocumentReindex: reindexKnowledgeDocument,
    onKnowledgeDocumentSave: saveKnowledgeDocument,
    onKnowledgeDocumentSelect: selectKnowledgeDocument,
    onProfileSave: saveProfile,
    openProfile,
    profileSkillIds,
    refetchKnowledgeDocumentQueries,
    refetchSkillQueries,
    selectedKnowledgeDocument,
    selectedKnowledgeDocumentNeedsReindex,
    selectedProfile,
    setIsMobileSheetOpen,
    skills: canManageSelectedProfile ? skills : [],
  };
}
