"use client";

import {
  OpenRouterChatModelGroup,
  OpenRouterChatModelOption,
  OpenRouterReasoningValue,
} from "../types";
import { openRouterReasoningOptions } from "../hooks/use-openrouter-model-controls";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Bot, Brain, ChevronDown, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

interface OpenRouterControlsProps {
  favoriteModelIds: string[];
  isUpdatingFavorites: boolean;
  isLoadingModels: boolean;
  modelGroups: OpenRouterChatModelGroup[];
  onFavoriteToggle: (modelId: string) => void;
  selectedModelId: string;
  selectedModelLabel: string;
  selectedReasoning: OpenRouterReasoningValue;
  selectedReasoningLabel: string;
  showReasoningControl: boolean;
  onModelChange: (value: string) => void;
  onReasoningChange: (value: OpenRouterReasoningValue) => void;
}

export function OpenRouterControls(props: OpenRouterControlsProps) {
  const [modelSearch, setModelSearch] = useState("");
  const favoriteModelIdsSet = useMemo(() => {
    return new Set(props.favoriteModelIds);
  }, [props.favoriteModelIds]);
  const allModels = useMemo(() => {
    const models = new Map<string, OpenRouterChatModelOption>();

    for (const group of props.modelGroups) {
      for (const model of group.models) {
        models.set(model.id, model);
      }
    }

    return models;
  }, [props.modelGroups]);
  const normalizedModelSearch = modelSearch.trim().toLowerCase();
  const modelMatchesSearch = (model: OpenRouterChatModelOption) => {
    if (!normalizedModelSearch) {
      return true;
    }

    return [model.name, model.id, model.description].some((value) => {
      return value.toLowerCase().includes(normalizedModelSearch);
    });
  };
  const favoriteModels = props.favoriteModelIds
    .map((modelId) => {
      return allModels.get(modelId) || null;
    })
    .filter((model): model is OpenRouterChatModelOption => {
      return Boolean(model);
    })
    .filter((model) => modelMatchesSearch(model));
  const filteredModelGroups = props.modelGroups
    .map((group) => {
      return {
        ...group,
        models: group.models
          .filter((model) => {
            return !favoriteModelIdsSet.has(model.id);
          })
          .filter((model) => modelMatchesSearch(model)),
      };
    })
    .filter((group) => group.models.length);

  function renderModelOption(model: OpenRouterChatModelOption) {
    const isFavorite = favoriteModelIdsSet.has(model.id);

    return (
      <DropdownMenuRadioItem
        key={model.id}
        value={model.id}
        className="gap-2 pr-1"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{model.name}</span>
          <span className="truncate text-xs text-slate-500">{model.id}</span>
        </span>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-700",
            isFavorite && "text-amber-500 hover:text-amber-600",
          )}
          disabled={props.isUpdatingFavorites}
          aria-label={
            isFavorite
              ? "Remove model from favorites"
              : "Add model to favorites"
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            props.onFavoriteToggle(model.id);
          }}
        >
          <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
        </button>
      </DropdownMenuRadioItem>
    );
  }

  return (
    <div className="hidden shrink-0 items-center gap-1 sm:flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-auto max-w-36 gap-1 px-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900"
            aria-label="Select OpenRouter model"
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span className="truncate">{props.selectedModelLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-96">
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <div className="relative px-2 pb-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={modelSearch}
              onChange={(event) => {
                setModelSearch(event.target.value);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
              className="h-9 pl-8 text-sm"
              placeholder="Search model or slug..."
            />
          </div>
          <DropdownMenuRadioGroup
            value={props.selectedModelId}
            onValueChange={props.onModelChange}
          >
            <DropdownMenuRadioItem value="auto">
              <span className="flex min-w-0 flex-col">
                <span className="truncate">Auto</span>
                <span className="truncate text-xs text-slate-500">
                  Choose automatically
                </span>
              </span>
            </DropdownMenuRadioItem>
            {favoriteModels.length ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs uppercase tracking-normal text-slate-500">
                  Favorites
                </DropdownMenuLabel>
                {favoriteModels.map((model) => renderModelOption(model))}
              </>
            ) : null}
            {filteredModelGroups.length ? <DropdownMenuSeparator /> : null}
            <div className="max-h-80 overflow-y-auto">
              {filteredModelGroups.map((group) => {
                if (!group.models.length) {
                  return null;
                }

                return (
                  <div key={group.id}>
                    <DropdownMenuLabel className="text-xs uppercase tracking-normal text-slate-500">
                      {group.title}
                    </DropdownMenuLabel>
                    {group.models.map((model) => {
                      return renderModelOption(model);
                    })}
                  </div>
                );
              })}
            </div>
            {!props.modelGroups.length && props.isLoadingModels ? (
              <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                Loading models...
              </DropdownMenuLabel>
            ) : null}
            {props.modelGroups.length &&
            !filteredModelGroups.length &&
            !favoriteModels.length ? (
              <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                No models found.
              </DropdownMenuLabel>
            ) : null}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {props.showReasoningControl ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-auto max-w-28 gap-1 px-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900"
              aria-label="Select OpenRouter thinking"
            >
              <Brain className="h-4 w-4 shrink-0" />
              <span className="truncate">{props.selectedReasoningLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuLabel>Thinking</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={props.selectedReasoning}
              onValueChange={(value) => {
                props.onReasoningChange(value as OpenRouterReasoningValue);
              }}
            >
              {openRouterReasoningOptions.map((option) => {
                return (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
