"use client";

import type { IModelPickerOption, IModelPickerProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils/cn";
import { Button } from "@sps/shared-ui-shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@sps/shared-ui-shadcn/dropdown-menu";
import { Input } from "@sps/shared-ui-shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sps/shared-ui-shadcn/popover";
import { Bot, Brain, Check, ChevronDown, Search, Star } from "lucide-react";
import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const emptyFavorites: readonly string[] = [];

interface ModelOptionProps {
  id: string;
  name: string;
  details: string;
  isSelected: boolean;
  favoriteId?: string;
  favoriteLabel?: string;
  favoriteAction?: string;
  isFavorite?: boolean;
  isUpdatingFavorites?: boolean;
  onSelect: (id: string) => void;
  onFavoriteToggle?: (canonicalId: string) => void;
}

const ModelOption = memo(function ModelOption(props: ModelOptionProps) {
  return (
    <li className="flex min-w-0 items-center gap-1 rounded-md hover:bg-accent/60">
      <button
        type="button"
        data-model-choice
        aria-current={props.isSelected || undefined}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        onClick={() => props.onSelect(props.id)}
      >
        <Check
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0",
            props.isSelected ? "text-primary" : "invisible",
          )}
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{props.name}</span>
          {props.details && (
            <span className="truncate text-xs text-muted-foreground">
              {props.details}
            </span>
          )}
        </span>
      </button>
      {props.onFavoriteToggle && (
        <button
          type="button"
          aria-label={props.favoriteLabel}
          title={props.favoriteAction}
          aria-pressed={props.isFavorite}
          disabled={props.isUpdatingFavorites}
          className={cn(
            "mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
            props.isFavorite && "text-amber-600 dark:text-amber-400",
          )}
          onClick={() => props.onFavoriteToggle?.(props.favoriteId ?? props.id)}
        >
          <Star
            aria-hidden="true"
            className={cn("size-4", props.isFavorite && "fill-current")}
          />
        </button>
      )}
    </li>
  );
});

export function ModelPicker<TEffort extends string>(
  props: IModelPickerProps<TEffort>,
) {
  const ru = props.language === "ru";
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const modelLabelId = useId();
  const reasoningLabelId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const { modelLabel, autoLabel, favoriteModelIds = emptyFavorites } = props;
  const unavailableLabel = ru ? "Модель недоступна" : "Model unavailable";
  const selectedLabel = props.isSelectionUnavailable
    ? unavailableLabel
    : props.selectedModelId === "auto"
      ? autoLabel
      : props.selectedModelLabel;

  const { favorites, groups } = useMemo(() => {
    const models = new Map<string, IModelPickerOption[]>();
    const matchingGroups = props.modelGroups.map((group) => ({
      ...group,
      models: group.models.filter((model) => {
        const canonicalId = model.canonicalId ?? model.id;
        if (
          query &&
          ![model.name, model.id, model.description, canonicalId].some(
            (value) => value?.toLowerCase().includes(query),
          )
        ) {
          return false;
        }
        if (!favoriteModelIds.includes(canonicalId)) return true;
        const favorites = models.get(canonicalId) ?? [];
        if (!favorites.some(({ id }) => id === model.id)) {
          models.set(canonicalId, [...favorites, model]);
        }
        return false;
      }),
    }));
    return {
      favorites: favoriteModelIds.flatMap((id) => models.get(id) ?? []),
      groups: matchingGroups.filter(({ models }) => models.length),
    };
  }, [favoriteModelIds, props.modelGroups, query]);

  const changeOpen = useCallback((value: boolean) => {
    setOpen(value);
    if (!value) setSearch("");
  }, []);

  const selectModel = useCallback(
    (id: string) => {
      props.onModelChange(id);
      changeOpen(false);
    },
    [changeOpen, props.onModelChange],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      searchRef.current?.focus();
      props.onFavoriteToggle?.(id);
    },
    [props.onFavoriteToggle],
  );

  function navigateOptions(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const options = Array.from(
      optionsRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-model-choice]",
      ) ?? [],
    );
    if (!options.length) return;
    const index = options.findIndex((option) => option === event.target);
    if (index < 0 && event.target !== searchRef.current) return;
    event.preventDefault();
    if (event.key === "ArrowDown") {
      options[Math.min(index + 1, options.length - 1)]?.focus();
    } else if (index === 0) {
      searchRef.current?.focus();
    } else {
      options[index < 0 ? options.length - 1 : index - 1]?.focus();
    }
  }

  function renderModel(model: IModelPickerOption) {
    const favoriteId = model.canonicalId ?? model.id;
    const isFavorite = favoriteModelIds.includes(favoriteId);
    const modelName =
      props.showModelDescription && model.description
        ? `${model.name} (${model.description})`
        : model.name;
    const favoriteAction = isFavorite
      ? ru
        ? `Убрать «${modelName}» из избранного`
        : `Remove ${modelName} from favorites`
      : ru
        ? `Добавить «${modelName}» в избранное`
        : `Add ${modelName} to favorites`;
    const details = [
      model.id !== model.name && model.id,
      props.showModelDescription && model.description,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <ModelOption
        key={model.id}
        id={model.id}
        name={model.name}
        details={details}
        isSelected={props.selectedModelId === model.id}
        isFavorite={isFavorite}
        favoriteId={favoriteId}
        favoriteLabel={
          ru ? `«${modelName}» в избранном` : `Favorite ${modelName}`
        }
        favoriteAction={favoriteAction}
        isUpdatingFavorites={props.isUpdatingFavorites}
        onSelect={selectModel}
        onFavoriteToggle={props.onFavoriteToggle ? toggleFavorite : undefined}
      />
    );
  }

  const searchLabel = ru ? "Поиск модели" : "Search models";
  const reasoningLabel = ru ? "Режим рассуждения" : "Thinking";

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1">
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={props.disabled}
            id={props.id}
            className={cn(
              "h-9 w-auto max-w-44 gap-1.5 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
              props.modelTriggerClassName,
            )}
            aria-label={modelLabel}
            aria-describedby={[modelLabelId, props["aria-describedby"]]
              .filter(Boolean)
              .join(" ")}
          >
            <Bot className="size-4 shrink-0" aria-hidden="true" />
            <span id={modelLabelId} className="truncate">
              {selectedLabel}
            </span>
            <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          sideOffset={8}
          collisionPadding={12}
          className="flex max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl p-0"
          aria-label={modelLabel}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          onKeyDown={navigateOptions}
        >
          <div className="relative shrink-0 border-b px-2 py-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={searchRef}
              value={search}
              type="search"
              onChange={(event) => setSearch(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing)
                  return;
                event.preventDefault();
                optionsRef.current
                  ?.querySelector<HTMLButtonElement>("[data-model-choice]")
                  ?.click();
              }}
              className="h-9 pl-8"
              aria-label={searchLabel}
              placeholder={searchLabel}
            />
          </div>
          <div
            ref={optionsRef}
            className="max-h-80 min-h-0 overflow-y-auto p-1"
          >
            {!query && (
              <ul>
                <ModelOption
                  id="auto"
                  name={autoLabel}
                  details=""
                  isSelected={props.selectedModelId === "auto"}
                  onSelect={selectModel}
                />
              </ul>
            )}
            {favorites.length > 0 && (
              <>
                <h3 className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                  {ru ? "Избранное" : "Favorites"}
                </h3>
                <ul>{favorites.map(renderModel)}</ul>
              </>
            )}
            {groups.map((group) => (
              <div key={group.id}>
                <h3 className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                  {group.title}
                </h3>
                <ul>{group.models.map(renderModel)}</ul>
              </div>
            ))}
            {!groups.length && !favorites.length && (
              <p
                role="status"
                className="px-2 py-3 text-sm text-muted-foreground"
              >
                {props.isLoadingModels
                  ? ru
                    ? "Загружаем модели…"
                    : "Loading models…"
                  : ru
                    ? "Модели не найдены"
                    : "No models found"}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {props.reasoningOptions.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={props.disabled}
              className={cn(
                "h-9 w-auto max-w-36 gap-1.5 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                props.reasoningTriggerClassName,
              )}
              aria-label={props.reasoningControlLabel ?? reasoningLabel}
              aria-describedby={reasoningLabelId}
            >
              <Brain className="size-4 shrink-0" aria-hidden="true" />
              <span id={reasoningLabelId} className="truncate">
                {
                  props.reasoningOptions.find(
                    ({ value }) => value === props.selectedReasoning,
                  )?.[ru ? "labelRu" : "label"]
                }
              </span>
              <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-44">
            <DropdownMenuLabel>{reasoningLabel}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={props.selectedReasoning}
              onValueChange={(value) => {
                const choice = props.reasoningOptions.find(
                  (option) => option.value === value,
                );
                if (choice) props.onReasoningChange(choice.value);
              }}
            >
              {props.reasoningOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {ru ? option.labelRu : option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export type { IModelPickerProps } from "./interface";
