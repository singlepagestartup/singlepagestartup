"use client";

import {
  SkillCreateContext,
  SkillCreateValues,
  SkillUpdateValues,
  SocialSkill,
} from "../types";
import { getMentionedSkillSlugs } from "../utils";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/client";
import { route as rbacSubjectRoute } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseProfileSkillsProps {
  subjectId: string;
  requesterSocialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  onSkillSaved?: () => void;
}

export function useProfileSkills(props: UseProfileSkillsProps) {
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const targetSkillsQuery =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
      {
        id: props.subjectId,
        socialModuleProfileId: props.requesterSocialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: props.socialModuleProfileId,
        options: {
          headers: {
            "Cache-Control": "no-store",
          },
        },
        reactQueryOptions: {
          enabled: Boolean(props.socialModuleProfileId),
        },
      },
    );
  const socialModuleSkillCreate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.requesterSocialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: props.socialModuleProfileId,
      },
    );
  const socialModuleSkillUpdate =
    rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate(
      {
        id: props.subjectId,
        socialModuleProfileId: props.requesterSocialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        targetSocialModuleProfileId: props.socialModuleProfileId,
        socialModuleSkillId: "pending-skill",
      },
    );

  const profileSkills = useMemo(() => {
    return ((targetSkillsQuery.data || []) as SocialSkill[]).filter((skill) => {
      return skill.status !== "archived";
    });
  }, [targetSkillsQuery.data]);

  const profileSkillIds = useMemo(() => {
    return profileSkills.map((skill) => {
      return skill.id;
    });
  }, [profileSkills]);

  const skillListQueryKey = useMemo(() => {
    return [
      `${rbacSubjectRoute}/${props.subjectId}/social-module/profiles/${props.requesterSocialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.socialModuleProfileId}/skills`,
    ];
  }, [
    props.requesterSocialModuleProfileId,
    props.socialModuleChatId,
    props.socialModuleProfileId,
    props.subjectId,
  ]);

  const refetchProfileSkills = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: skillListQueryKey,
    });
    void targetSkillsQuery.refetch();
  }, [skillListQueryKey, targetSkillsQuery]);

  const selectedSkills = useMemo(() => {
    const skillsById = new Map(profileSkills.map((skill) => [skill.id, skill]));

    return selectedSkillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is SocialSkill => Boolean(skill));
  }, [profileSkills, selectedSkillIds]);

  function selectSkill(skill: SocialSkill) {
    setSelectedSkillIds((current) => {
      if (current.includes(skill.id)) {
        return current;
      }

      return [...current, skill.id];
    });
  }

  function removeSelectedSkill(skillId: string) {
    setSelectedSkillIds((current) => {
      return current.filter((item) => item !== skillId);
    });
  }

  function clearSelectedSkills() {
    setSelectedSkillIds((current) => {
      return current.length === 0 ? current : [];
    });
  }

  const syncSelectedSkillsToDescription = useCallback(
    (description?: string | null) => {
      const mentionedSkillSlugs = getMentionedSkillSlugs(description);
      const nextSelectedSkillIds = profileSkills
        .filter((skill) => {
          return mentionedSkillSlugs.has(skill.slug.toLowerCase());
        })
        .map((skill) => skill.id);

      setSelectedSkillIds((current) => {
        if (
          current.length === nextSelectedSkillIds.length &&
          current.every((skillId, index) => {
            return skillId === nextSelectedSkillIds[index];
          })
        ) {
          return current;
        }

        return nextSelectedSkillIds;
      });
    },
    [profileSkills],
  );

  async function createSkillAndLinkToProfile(
    values: SkillCreateValues,
    context: SkillCreateContext,
  ) {
    await socialModuleSkillCreate.mutateAsync({
      id: props.subjectId,
      socialModuleProfileId: props.requesterSocialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId: context.profileId,
      data: {
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status,
        orderIndex: context.orderIndex,
      },
    });

    toast.success("Skill created and linked to profile");
    refetchProfileSkills();
    props.onSkillSaved?.();
  }

  async function updateProfileSkill(
    skill: SocialSkill,
    values: SkillUpdateValues,
    targetSocialModuleProfileId = props.socialModuleProfileId,
  ) {
    await socialModuleSkillUpdate.mutateAsync({
      id: props.subjectId,
      socialModuleProfileId: props.requesterSocialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      targetSocialModuleProfileId,
      socialModuleSkillId: skill.id,
      data: {
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status,
      },
    });

    toast.success("Skill updated");
    refetchProfileSkills();
    props.onSkillSaved?.();
  }

  return {
    clearSelectedSkills,
    createSkillAndLinkToProfile,
    updateProfileSkill,
    isCreatingSkill: socialModuleSkillCreate.isPending,
    isUpdatingSkill: socialModuleSkillUpdate.isPending,
    isLoadingSkills: targetSkillsQuery.isLoading,
    profileSkillIds,
    profileSkills,
    removeSelectedSkill,
    selectedSkillIds,
    selectedSkills,
    selectSkill,
    syncSelectedSkillsToDescription,
  };
}
