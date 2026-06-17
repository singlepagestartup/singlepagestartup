"use client";

import {
  OpenRouterChatModelGroup,
  OpenRouterChatModelOption,
  OpenRouterReasoningValue,
} from "../types";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseOpenRouterModelControlsProps {
  enabled: boolean;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
}

export const openRouterReasoningOptions: {
  label: string;
  value: OpenRouterReasoningValue;
}[] = [
  {
    label: "Auto",
    value: "auto",
  },
  {
    label: "Off",
    value: "none",
  },
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Extra High",
    value: "xhigh",
  },
];

function getFavoriteModelsStorageKey(subjectId: string) {
  return `sps.openrouter.modelFavorites.${subjectId}`;
}

function normalizeFavoriteModelIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => {
          return typeof item === "string" ? item.trim() : "";
        })
        .filter((item) => {
          return item && item !== "auto" && item.length <= 200;
        }),
    ),
  ).slice(0, 50);
}

function readLocalFavoriteModelIds(subjectId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      getFavoriteModelsStorageKey(subjectId),
    );

    return normalizeFavoriteModelIds(JSON.parse(rawValue || "[]"));
  } catch {
    return [];
  }
}

function writeLocalFavoriteModelIds(subjectId: string, modelIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getFavoriteModelsStorageKey(subjectId),
      JSON.stringify(normalizeFavoriteModelIds(modelIds)),
    );
  } catch {
    return;
  }
}

export function useOpenRouterModelControls(
  props: UseOpenRouterModelControlsProps,
) {
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [selectedReasoning, setSelectedReasoning] =
    useState<OpenRouterReasoningValue>("auto");
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([]);

  // The chat shell stays mounted across chats/threads, so a stale model
  // selection would otherwise leak into a new chat whose assistant may not
  // expose it (issue #195). Reset to defaults whenever the chat or thread
  // changes; the next chat re-selects intentionally.
  useEffect(() => {
    setSelectedModelId("auto");
    setSelectedReasoning("auto");
  }, [props.socialModuleChatId, props.socialModuleThreadId]);

  useEffect(() => {
    setFavoriteModelIds(readLocalFavoriteModelIds(props.subjectId));
  }, [props.subjectId]);

  const modelsQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      reactQueryOptions: {
        enabled: props.enabled,
      },
    });
  const favoritesQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      reactQueryOptions: {
        enabled: props.enabled,
      },
    });
  const favoritesMutation =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
    });
  const modelGroups = useMemo<OpenRouterChatModelGroup[]>(() => {
    return (modelsQuery.data?.groups || []) as OpenRouterChatModelGroup[];
  }, [modelsQuery.data?.groups]);
  const selectedModel = useMemo<OpenRouterChatModelOption | null>(() => {
    if (selectedModelId === "auto") {
      return null;
    }

    for (const group of modelGroups) {
      const model = group.models.find((item) => item.id === selectedModelId);

      if (model) {
        return model;
      }
    }

    return null;
  }, [modelGroups, selectedModelId]);
  const selectedModelLabel =
    selectedModelId === "auto"
      ? "Auto"
      : selectedModel?.name || selectedModelId;
  const canSelectReasoning =
    selectedModelId === "auto" || Boolean(selectedModel?.supportsReasoning);
  const effectiveSelectedReasoning: OpenRouterReasoningValue =
    canSelectReasoning ? selectedReasoning : "auto";
  const selectedReasoningLabel =
    openRouterReasoningOptions.find((item) => {
      return item.value === effectiveSelectedReasoning;
    })?.label || "Auto";
  const favoriteModelIdSet = useMemo(() => {
    return new Set(favoriteModelIds);
  }, [favoriteModelIds]);
  const persistFavoriteModelIds = useCallback(
    (modelIds: string[]) => {
      const normalizedModelIds = normalizeFavoriteModelIds(modelIds);

      setFavoriteModelIds(normalizedModelIds);
      writeLocalFavoriteModelIds(props.subjectId, normalizedModelIds);

      if (!props.enabled) {
        return;
      }

      favoritesMutation.mutate({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        data: {
          favoriteModelIds: normalizedModelIds,
        },
      });
    },
    [
      favoritesMutation,
      props.enabled,
      props.socialModuleChatId,
      props.socialModuleProfileId,
      props.subjectId,
    ],
  );
  const toggleFavoriteModelId = useCallback(
    (modelId: string) => {
      if (!modelId || modelId === "auto") {
        return;
      }

      const nextFavoriteModelIds = favoriteModelIdSet.has(modelId)
        ? favoriteModelIds.filter((favoriteModelId) => {
            return favoriteModelId !== modelId;
          })
        : [...favoriteModelIds, modelId];

      persistFavoriteModelIds(nextFavoriteModelIds);
    },
    [favoriteModelIdSet, favoriteModelIds, persistFavoriteModelIds],
  );

  useEffect(() => {
    const kvFavoriteModelIds = normalizeFavoriteModelIds(
      favoritesQuery.data?.favoriteModelIds,
    );

    if (!kvFavoriteModelIds.length) {
      return;
    }

    setFavoriteModelIds(kvFavoriteModelIds);
    writeLocalFavoriteModelIds(props.subjectId, kvFavoriteModelIds);
  }, [favoritesQuery.data?.favoriteModelIds, props.subjectId]);

  useEffect(() => {
    if (canSelectReasoning || selectedReasoning === "auto") {
      return;
    }

    setSelectedReasoning("auto");
  }, [canSelectReasoning, selectedReasoning]);

  return {
    canSelectReasoning,
    favoriteModelIds,
    favoriteModelIdSet,
    favoritesQuery,
    isLoadingModels: modelsQuery.isLoading,
    isUpdatingFavoriteModels: favoritesMutation.isPending,
    modelGroups,
    modelsQuery,
    selectedModel,
    selectedModelId,
    selectedModelLabel,
    selectedReasoning: effectiveSelectedReasoning,
    selectedReasoningLabel,
    setSelectedModelId,
    setSelectedReasoning,
    toggleFavoriteModelId,
  };
}
