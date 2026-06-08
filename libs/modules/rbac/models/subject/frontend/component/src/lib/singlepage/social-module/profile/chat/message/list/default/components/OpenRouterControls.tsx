"use client";

import { OpenRouterChatModelGroup, OpenRouterReasoningValue } from "../types";
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
} from "@sps/shared-ui-shadcn";
import { Bot, Brain, ChevronDown } from "lucide-react";

interface OpenRouterControlsProps {
  isLoadingModels: boolean;
  modelGroups: OpenRouterChatModelGroup[];
  selectedModelId: string;
  selectedModelLabel: string;
  selectedReasoning: OpenRouterReasoningValue;
  selectedReasoningLabel: string;
  onModelChange: (value: string) => void;
  onReasoningChange: (value: OpenRouterReasoningValue) => void;
}

export function OpenRouterControls(props: OpenRouterControlsProps) {
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
        <DropdownMenuContent
          align="end"
          side="top"
          className="max-h-96 w-80 overflow-y-auto"
        >
          <DropdownMenuLabel>Model</DropdownMenuLabel>
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
            {props.modelGroups.length ? <DropdownMenuSeparator /> : null}
            {props.modelGroups.map((group) => {
              if (!group.models.length) {
                return null;
              }

              return (
                <div key={group.id}>
                  <DropdownMenuLabel className="text-xs uppercase tracking-normal text-slate-500">
                    {group.title}
                  </DropdownMenuLabel>
                  {group.models.map((model) => {
                    return (
                      <DropdownMenuRadioItem key={model.id} value={model.id}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{model.name}</span>
                          <span className="truncate text-xs text-slate-500">
                            {model.id}
                          </span>
                        </span>
                      </DropdownMenuRadioItem>
                    );
                  })}
                </div>
              );
            })}
            {!props.modelGroups.length && props.isLoadingModels ? (
              <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                Loading models...
              </DropdownMenuLabel>
            ) : null}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
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
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
