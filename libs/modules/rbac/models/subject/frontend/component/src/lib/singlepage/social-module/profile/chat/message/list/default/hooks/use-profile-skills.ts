"use client";

import {
  SkillCreateContext,
  SkillCreateValues,
  SkillUpdateValues,
  SocialSkill,
} from "../types";
import { getMentionedSkillSlugs } from "../utils";
import {
  api as socialModuleProfilesToSkillsApi,
  queryClient as socialModuleProfilesToSkillsQueryClient,
} from "@sps/social/relations/profiles-to-skills/sdk/client";
import { route as socialModuleProfilesToSkillsRoute } from "@sps/social/relations/profiles-to-skills/sdk/model";
import {
  api as socialModuleSkillApi,
  queryClient as socialModuleSkillQueryClient,
} from "@sps/social/models/skill/sdk/client";
import { route as socialModuleSkillRoute } from "@sps/social/models/skill/sdk/model";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseProfileSkillsProps {
  socialModuleProfileId: string;
  onSkillSaved?: () => void;
}

export function useProfileSkills(props: UseProfileSkillsProps) {
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const socialModuleSkillCreate = socialModuleSkillApi.create();
  const socialModuleSkillUpdate = socialModuleSkillApi.update();
  const socialModuleProfilesToSkillsCreate =
    socialModuleProfilesToSkillsApi.create();
  const socialModuleProfilesToSkillsFind = socialModuleProfilesToSkillsApi.find(
    {
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
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
    },
  );

  const profileSkillIds = useMemo(() => {
    return (
      socialModuleProfilesToSkillsFind.data
        ?.map((relation) => relation.skillId)
        .filter((skillId): skillId is string => {
          return Boolean(skillId);
        }) || []
    );
  }, [socialModuleProfilesToSkillsFind.data]);

  const socialModuleSkillsFind = socialModuleSkillApi.find({
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

  const profileSkills = useMemo(() => {
    const skillsById = new Map(
      (socialModuleSkillsFind.data || []).map((skill) => [skill.id, skill]),
    );

    return profileSkillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is SocialSkill => {
        return Boolean(skill && skill.status !== "archived");
      });
  }, [profileSkillIds, socialModuleSkillsFind.data]);

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
    // Bail out when already empty so callers (e.g. the composer reset that
    // runs after every send) do not schedule a no-op shell rerender.
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
    const skill = await socialModuleSkillCreate.mutateAsync({
      data: {
        variant: "default",
        className: "",
        title: values.title,
        slug: values.slug,
        adminTitle: values.title,
        description: values.description,
        status: values.status,
        defaultModelSlug: values.defaultModelSlug,
        allowedModelSlugs: values.allowedModelSlugs,
        metadata: values.metadata,
      },
    });

    await socialModuleProfilesToSkillsCreate.mutateAsync({
      data: {
        variant: "default",
        className: "",
        orderIndex: context.orderIndex,
        profileId: context.profileId,
        skillId: skill.id,
      },
    });

    toast.success("Skill created and linked to profile");
    void socialModuleSkillQueryClient.invalidateQueries({
      queryKey: [socialModuleSkillRoute],
    });
    void socialModuleProfilesToSkillsQueryClient.invalidateQueries({
      queryKey: [socialModuleProfilesToSkillsRoute],
    });
    props.onSkillSaved?.();
  }

  async function updateProfileSkill(
    skill: SocialSkill,
    values: SkillUpdateValues,
  ) {
    await socialModuleSkillUpdate.mutateAsync({
      id: skill.id,
      data: {
        variant: skill.variant || "default",
        className: skill.className || "",
        title: values.title,
        slug: values.slug,
        adminTitle: values.title,
        description: values.description,
        status: values.status,
        defaultModelSlug: values.defaultModelSlug,
        allowedModelSlugs: values.allowedModelSlugs,
        metadata: values.metadata,
      },
    });

    toast.success("Skill updated");
    void socialModuleSkillQueryClient.invalidateQueries({
      queryKey: [socialModuleSkillRoute],
    });
    props.onSkillSaved?.();
  }

  return {
    clearSelectedSkills,
    createSkillAndLinkToProfile,
    updateProfileSkill,
    isCreatingSkill:
      socialModuleSkillCreate.isPending ||
      socialModuleProfilesToSkillsCreate.isPending,
    isUpdatingSkill: socialModuleSkillUpdate.isPending,
    isLoadingSkills:
      socialModuleSkillsFind.isLoading ||
      socialModuleProfilesToSkillsFind.isLoading,
    profileSkillIds,
    profileSkills,
    removeSelectedSkill,
    selectedSkillIds,
    selectedSkills,
    selectSkill,
    syncSelectedSkillsToDescription,
  };
}
