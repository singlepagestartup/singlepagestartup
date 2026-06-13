"use client";

import {
  KnowledgeDocument,
  KnowledgeDocumentDraft,
  SocialSkill,
} from "../types";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/client";
import { route as rbacSubjectRoute } from "@sps/rbac/models/subject/sdk/model";
import { api as socialModuleProfilesToSkillsApi } from "@sps/social/relations/profiles-to-skills/sdk/client";
import { api as socialModuleSkillApi } from "@sps/social/models/skill/sdk/client";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import QueryString from "qs";

interface UseProfileSidebarProps {
  canUseKnowledge: boolean;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
}

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

  const profilesToSkillsFind = socialModuleProfilesToSkillsApi.find({
    params: {
      filters: {
        and: [
          {
            column: "profileId",
            method: "eq",
            value: selectedProfileId || "missing-profile",
          },
        ],
      },
      orderBy: {
        and: [
          {
            column: "orderIndex",
            method: "asc",
          },
          {
            column: "createdAt",
            method: "asc",
          },
        ],
      },
    },
    reactQueryOptions: {
      enabled: Boolean(selectedProfileId),
    },
  });

  const profileSkillIds = useMemo(() => {
    return (
      profilesToSkillsFind.data
        ?.map((relation) => relation.skillId)
        .filter((skillId): skillId is string => {
          return Boolean(skillId);
        }) || []
    );
  }, [profilesToSkillsFind.data]);

  const skillsFind = socialModuleSkillApi.find({
    params: {
      filters: {
        and: [
          {
            column: "id",
            method: "inArray",
            value: profileSkillIds,
          },
        ],
      },
    },
    reactQueryOptions: {
      enabled: profileSkillIds.length > 0,
    },
  });

  const skills = useMemo(() => {
    const skillsById = new Map(
      (skillsFind.data || []).map((skill) => [skill.id, skill]),
    );

    return profileSkillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is SocialSkill => {
        return Boolean(skill && skill.status !== "archived");
      });
  }, [profileSkillIds, skillsFind.data]);

  const knowledgeDocumentScopeParams = useMemo(() => {
    if (!selectedProfileId || !props.canUseKnowledge) {
      return undefined;
    }

    return {
      targetSocialModuleProfileId: selectedProfileId,
      socialModuleChatId: props.socialModuleChatId,
    };
  }, [props.canUseKnowledge, props.socialModuleChatId, selectedProfileId]);

  const {
    data: knowledgeDocumentsQuery,
    isLoading: isKnowledgeDocumentsLoading,
    refetch: refetchKnowledgeDocuments,
  } = rbacSubjectApi.socialModuleProfileFindByIdKnowledgeDocumentFind({
    id: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    params: knowledgeDocumentScopeParams,
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
    reactQueryOptions: {
      enabled: Boolean(knowledgeDocumentScopeParams),
    },
  });

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
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      knowledgeModuleDocumentId:
        selectedKnowledgeDocumentId || "missing-document",
    });
  const knowledgeDocumentReindex =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      knowledgeModuleDocumentId:
        selectedKnowledgeDocumentId || "missing-document",
    });
  const knowledgeDocumentDelete =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      knowledgeModuleDocumentId:
        selectedKnowledgeDocumentId || "missing-document",
    });
  const knowledgeDocumentCreate =
    rbacSubjectApi.socialModuleProfileFindByIdKnowledgeDocumentCreate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
    });

  const knowledgeDocumentsQueryKey = useMemo(() => {
    // Mirror the SDK read key exactly (issue #195): the SDK always appends
    // `?${QueryString.stringify(params)}`, so build the invalidation key the
    // same way instead of hand-concatenating params.
    const stringifiedQuery = QueryString.stringify(
      knowledgeDocumentScopeParams,
      {
        encodeValuesOnly: true,
      },
    );

    return [
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/knowledge/documents?${stringifiedQuery}`,
    ];
  }, [
    knowledgeDocumentScopeParams,
    props.socialModuleProfileId,
    props.subjectId,
  ]);

  const refetchKnowledgeDocumentQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: knowledgeDocumentsQueryKey,
    });

    if (knowledgeDocumentScopeParams) {
      void refetchKnowledgeDocuments();
    }
  }, [
    knowledgeDocumentScopeParams,
    knowledgeDocumentsQueryKey,
    refetchKnowledgeDocuments,
  ]);

  // Stable reference: passed as onProfileOpen to every memoized timeline row.
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

  function saveKnowledgeDocument(document: KnowledgeDocument) {
    if (!knowledgeDocumentScopeParams) {
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
          params: knowledgeDocumentScopeParams,
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
        knowledgeModuleDocumentId: document.id,
        params: knowledgeDocumentScopeParams,
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
    if (!knowledgeDocumentScopeParams) {
      return;
    }

    setReindexingKnowledgeDocumentId(document.id);

    try {
      await knowledgeDocumentReindex.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        knowledgeModuleDocumentId: document.id,
        params: knowledgeDocumentScopeParams,
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
      !knowledgeDocumentScopeParams ||
      document.id === newKnowledgeDocumentId
    ) {
      return;
    }

    try {
      await knowledgeDocumentDelete.mutateAsync({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        knowledgeModuleDocumentId: document.id,
        params: knowledgeDocumentScopeParams,
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
    closeKnowledgeDocument,
    closeProfile,
    isKnowledgeDocumentsLoading,
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
    isSkillsLoading: profilesToSkillsFind.isLoading || skillsFind.isLoading,
    knowledgeDocumentDraft,
    knowledgeDocuments,
    onKnowledgeDocumentDraftChange: setKnowledgeDocumentDraft,
    onKnowledgeDocumentCreate: createKnowledgeDocument,
    onKnowledgeDocumentDelete: deleteKnowledgeDocument,
    onKnowledgeDocumentReindex: reindexKnowledgeDocument,
    onKnowledgeDocumentSave: saveKnowledgeDocument,
    onKnowledgeDocumentSelect: selectKnowledgeDocument,
    openProfile,
    profileSkillIds,
    refetchKnowledgeDocumentQueries,
    selectedKnowledgeDocument,
    selectedKnowledgeDocumentNeedsReindex,
    selectedProfile,
    setIsMobileSheetOpen,
    skills,
  };
}
