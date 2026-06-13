"use client";

import {
  OpenRouterChatModelGroup,
  OpenRouterChatModelOption,
  OpenRouterReasoningValue,
} from "../types";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useEffect, useMemo, useState } from "react";

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

export function useOpenRouterModelControls(
  props: UseOpenRouterModelControlsProps,
) {
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [selectedReasoning, setSelectedReasoning] =
    useState<OpenRouterReasoningValue>("auto");

  // The chat shell stays mounted across chats/threads, so a stale model
  // selection would otherwise leak into a new chat whose assistant may not
  // expose it (issue #195). Reset to defaults whenever the chat or thread
  // changes; the next chat re-selects intentionally.
  useEffect(() => {
    setSelectedModelId("auto");
    setSelectedReasoning("auto");
  }, [props.socialModuleChatId, props.socialModuleThreadId]);

  const modelsQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      reactQueryOptions: {
        enabled: props.enabled,
      },
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
  const selectedReasoningLabel =
    openRouterReasoningOptions.find((item) => {
      return item.value === selectedReasoning;
    })?.label || "Auto";

  return {
    isLoadingModels: modelsQuery.isLoading,
    modelGroups,
    modelsQuery,
    selectedModel,
    selectedModelId,
    selectedModelLabel,
    selectedReasoning,
    selectedReasoningLabel,
    setSelectedModelId,
    setSelectedReasoning,
  };
}
