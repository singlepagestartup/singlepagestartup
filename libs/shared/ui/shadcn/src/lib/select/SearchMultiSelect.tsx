"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Command, CommandInput, CommandItem, CommandList } from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { settingsFormStyles } from "../form/styles";

export interface ISearchSelectOption {
  id: string;
  label: string;
}

export interface ISearchSelectQuery {
  offset: number;
  limit: number;
  search: string;
}

interface ISearchMultiSelectProps {
  label: string;
  searchLabel: string;
  language: string;
  selected: ISearchSelectOption[];
  disabled?: boolean;
  maxSelected?: number;
  onChange: (items: ISearchSelectOption[]) => void;
  renderSelected?: (item: ISearchSelectOption) => ReactNode;
  usePage: (query: ISearchSelectQuery) => {
    items: ISearchSelectOption[];
    total?: number;
    loading: boolean;
    error: boolean;
    retry: () => void;
  };
}

const Option = memo(function Option({
  item,
  checked,
  disabled,
  onToggle,
}: {
  item: ISearchSelectOption;
  checked: boolean;
  disabled: boolean;
  onToggle: (item: ISearchSelectOption) => void;
}) {
  return (
    <CommandItem
      value={item.id}
      aria-checked={checked}
      disabled={disabled}
      onSelect={() => onToggle(item)}
      className="min-h-10 cursor-pointer justify-between rounded-lg px-3"
    >
      <span className="min-w-0 break-words">{item.label}</span>
      {checked && <Check className="size-4" aria-hidden="true" />}
    </CommandItem>
  );
});

function Options({
  label,
  language,
  searchLabel,
  selected,
  maxSelected,
  usePage,
  onToggle,
}: Pick<
  ISearchMultiSelectProps,
  "label" | "language" | "searchLabel" | "selected" | "maxSelected" | "usePage"
> & { onToggle: (item: ISearchSelectOption) => void }) {
  const ru = language === "ru";
  const [input, setInput] = useState("");
  const [query, setQuery] = useState<ISearchSelectQuery>({
    search: "",
    offset: 0,
    limit: 10,
  });
  useEffect(() => {
    const search = input.trim();
    if (search === query.search) return;
    const timer = setTimeout(
      () => setQuery((previous) => ({ ...previous, search, offset: 0 })),
      200,
    );
    return () => clearTimeout(timer);
  }, [input, query.search]);
  const page = usePage(query);
  const first = query.offset + 1;
  const last = query.offset + page.items.length;
  const pending = page.loading || input.trim() !== query.search;
  return (
    <>
      <Command label={searchLabel} shouldFilter={false} loop className="gap-2">
        <CommandInput
          value={input}
          maxLength={180}
          aria-label={searchLabel}
          placeholder={searchLabel}
          onValueChange={setInput}
        />
        <CommandList
          aria-multiselectable="true"
          aria-label={label}
          className="max-h-[min(40dvh,18rem)]"
        >
          {pending ? (
            <p
              role="status"
              className="px-2 py-3 text-sm text-muted-foreground"
            >
              {ru ? "Загрузка…" : "Loading…"}
            </p>
          ) : page.error ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 px-2 text-sm"
            >
              {ru ? "Не удалось загрузить список." : "Could not load the list."}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-auto"
                onClick={page.retry}
              >
                {ru ? "Повторить" : "Retry"}
              </Button>
            </div>
          ) : page.items.length ? (
            page.items.map((item) => {
              const checked = selected.some(({ id }) => id === item.id);
              return (
                <Option
                  key={item.id}
                  item={item}
                  checked={checked}
                  disabled={
                    !checked &&
                    maxSelected !== undefined &&
                    selected.length >= maxSelected
                  }
                  onToggle={onToggle}
                />
              );
            })
          ) : (
            <p
              role="status"
              className="px-2 py-3 text-sm text-muted-foreground"
            >
              {ru ? "Ничего не найдено." : "No matches found."}
            </p>
          )}
        </CommandList>
      </Command>
      {maxSelected !== undefined && selected.length >= maxSelected && (
        <p role="status" className="px-2 text-sm text-muted-foreground">
          {ru
            ? `Можно выбрать до ${maxSelected} позиций.`
            : `Select up to ${maxSelected} items.`}
        </p>
      )}
      {!pending &&
        !page.error &&
        (query.offset > 0 || (page.total ?? 0) > query.limit) && (
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
            <span>
              {page.items.length ? `${first}–${last}` : 0} {ru ? "из" : "of"}{" "}
              {page.total}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={ru ? "Предыдущая страница" : "Previous page"}
                disabled={!query.offset}
                onClick={() =>
                  setQuery({
                    ...query,
                    offset: Math.max(0, query.offset - query.limit),
                  })
                }
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={ru ? "Следующая страница" : "Next page"}
                disabled={last >= (page.total ?? 0) || !page.items.length}
                onClick={() =>
                  setQuery({ ...query, offset: query.offset + query.limit })
                }
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        )}
    </>
  );
}

export function SearchMultiSelect(props: ISearchMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { disabled, label, language, selected, onChange, renderSelected } =
    props;
  const toggle = useCallback(
    (item: ISearchSelectOption) => {
      if (disabled) return;
      onChange(
        selected.some(({ id }) => id === item.id)
          ? selected.filter(({ id }) => id !== item.id)
          : [...selected, item],
      );
    },
    [disabled, onChange, selected],
  );
  return (
    <div className="grid min-w-0 gap-2">
      <Popover open={open && !disabled} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={`${settingsFormStyles.field} justify-between text-left`}
          >
            {label}
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={label}
          className="z-[80] grid w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] gap-2 p-2"
        >
          {open && <Options {...props} onToggle={toggle} />}
        </PopoverContent>
      </Popover>
      {!!selected.length && (
        <ul
          aria-label={language === "ru" ? "Выбрано" : "Selected"}
          className="flex flex-wrap gap-2"
        >
          {selected.map((item) => (
            <li key={item.id} className="min-w-0 max-w-full">
              <Badge
                variant="secondary"
                className="max-w-full gap-1 rounded-xl py-0 pl-3 pr-0.5"
              >
                {renderSelected?.(item) ?? item.label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-xl"
                  aria-label={`${language === "ru" ? "Убрать" : "Remove"} «${item.label}»`}
                  disabled={disabled}
                  onClick={() => toggle(item)}
                >
                  <X aria-hidden="true" className="size-3.5" />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
