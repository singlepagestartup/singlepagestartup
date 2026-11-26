"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreCatalogDirectoryItem,
  TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@sps/shared-ui-shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sps/shared-ui-shadcn/popover";
import { settingsFormStyles } from "@sps/shared-ui-shadcn/form/styles";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { directoryItemLabel } from "./labels";

interface IPickerProps {
  subjectId: string;
  storeId: string;
  kind: TStoreCatalogDirectoryKind;
  language: string;
  label: string;
  value?: IStoreCatalogDirectoryItem;
  onSelect: (item: IStoreCatalogDirectoryItem) => void;
  disabledIds?: string[];
  disabled?: boolean;
}

export function DirectoryPicker(props: IPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled}
          aria-label={props.label}
          className={`${settingsFormStyles.field} justify-between text-left`}
        >
          <span className="truncate">
            {props.value
              ? directoryItemLabel(props.value, props.language)
              : props.label}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-60 max-w-[calc(100vw-2rem)] p-0"
      >
        {open && (
          <PickerOptions
            {...props}
            onSelect={(item) => {
              props.onSelect(item);
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function PickerOptions({
  subjectId,
  storeId,
  kind,
  language,
  label,
  onSelect,
  disabledIds,
}: IPickerProps) {
  const ru = language === "ru";
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const page = api.storeCatalogDirectories.useList({
    id: subjectId,
    storeId,
    kind,
    offset,
    limit,
    search: search.trim() || undefined,
  });
  const items = page.data?.items ?? [];
  return (
    <>
      <Command shouldFilter={false} label={label}>
        <CommandInput
          value={search}
          maxLength={180}
          placeholder={ru ? "Поиск" : "Search"}
          aria-label={ru ? "Поиск" : "Search"}
          onValueChange={(next) => {
            setSearch(next);
            setOffset(0);
          }}
        />
        <CommandList>
          {page.isError ? (
            <div role="alert" className="p-3 text-sm">
              {ru ? "Не удалось загрузить список." : "Could not load the list."}{" "}
              <Button
                type="button"
                variant="link"
                className="w-auto"
                onClick={() => void page.refetch()}
              >
                {ru ? "Повторить" : "Retry"}
              </Button>
            </div>
          ) : !page.data || !items.length ? (
            <p role="status" className="p-3 text-sm text-muted-foreground">
              {page.isPending
                ? ru
                  ? "Загрузка…"
                  : "Loading…"
                : ru
                  ? "Ничего не найдено."
                  : "No matches found."}
            </p>
          ) : (
            items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                disabled={disabledIds?.includes(item.id)}
                onSelect={() => onSelect(item)}
              >
                {directoryItemLabel(item, language)}
              </CommandItem>
            ))
          )}
        </CommandList>
      </Command>
      {(offset > 0 || (page.data?.total ?? 0) > limit) && (
        <div className="flex items-center justify-between gap-2 border-t px-3 py-1.5 text-xs">
          <span>
            {offset + 1}–{offset + items.length} {ru ? "из" : "of"}{" "}
            {page.data?.total ?? "…"}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!offset}
              aria-label={ru ? "Предыдущая страница" : "Previous page"}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={page.data?.nextOffset === undefined}
              aria-label={ru ? "Следующая страница" : "Next page"}
              onClick={() => setOffset(page.data?.nextOffset ?? offset)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
