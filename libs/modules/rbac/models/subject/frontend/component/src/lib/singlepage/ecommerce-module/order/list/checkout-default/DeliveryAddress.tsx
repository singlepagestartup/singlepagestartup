"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@sps/shared-ui-shadcn";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import type { IDeliveryAddressProps } from "./interface";

export function DeliveryAddress(props: IDeliveryAddressProps) {
  const ru = props.language === "ru";
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const text = props.value.trim();
  const listId = props.id + "-suggestions";
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing || text.length < 3) {
      setQuery("");
      return;
    }
    const timer = setTimeout(() => setQuery(text), 300);
    return () => clearTimeout(timer);
  }, [text, editing]);

  const enabled = editing && query.length >= 3 && query === text;
  const suggestions = offerApi.addressSuggestions({
    data: { offerId: props.offerId, query, language: props.language },
    reactQueryOptions: { enabled },
  });
  const options = enabled ? (suggestions.data?.suggestions ?? []) : [];
  const expanded = options.length > 0;

  useEffect(() => {
    if (!expanded) return;
    // Dismiss suggestions before the enclosing sheet handles Escape on document capture.
    function onEscape(event: KeyboardEvent) {
      if (
        event.key !== "Escape" ||
        event.isComposing ||
        !(event.target instanceof Node) ||
        !field.current?.contains(event.target)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setEditing(false);
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [expanded]);

  function select(address: string) {
    setEditing(false);
    setActive(-1);
    props.onChange(address, true);
  }

  return (
    <div
      ref={field}
      className="grid min-w-0 gap-1 text-xs font-medium"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setEditing(false);
      }}
    >
      <label htmlFor={props.id}>{props.label}</label>
      <Input
        id={props.id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={
          expanded && active >= 0 && active < options.length
            ? listId + "-" + active
            : undefined
        }
        maxLength={500}
        className={props.className}
        placeholder={
          ru ? "Город, улица и дом" : "City, street and house number"
        }
        value={props.value}
        onChange={(event) => {
          setEditing(true);
          setActive(-1);
          props.onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || !expanded) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next =
              event.key === "ArrowDown"
                ? Math.min(active + 1, options.length - 1)
                : active < 0
                  ? options.length - 1
                  : Math.max(active - 1, 0);
            setActive(next);
            document
              .getElementById(listId + "-" + next)
              ?.scrollIntoView?.({ block: "nearest" });
          } else if (event.key === "Enter" && options[active]) {
            event.preventDefault();
            select(options[active]);
          }
        }}
      />
      {expanded && (
        <ul
          role="listbox"
          aria-label={ru ? "Подходящие адреса" : "Suggested addresses"}
          id={listId}
          className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1 text-sm font-normal shadow-sm"
        >
          {options.map((address, index) => (
            <li
              role="option"
              id={listId + "-" + index}
              key={address}
              aria-selected={index === active}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-foreground hover:bg-muted aria-selected:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(address)}
            >
              {address}
            </li>
          ))}
        </ul>
      )}
      {expanded && Boolean(suggestions.data?.attribution?.length) && (
        <div className="flex flex-wrap justify-end gap-x-2 text-xs text-muted-foreground">
          {suggestions.data?.attribution?.map(({ label, url }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
              onMouseDown={(event) => event.preventDefault()}
            >
              {label}
            </a>
          ))}
        </div>
      )}
      {enabled && suggestions.isError && (
        <span
          role="status"
          className="text-xs font-normal text-muted-foreground"
        >
          {ru
            ? "Подсказки недоступны. Введите адрес полностью."
            : "Address suggestions are unavailable. Enter the full address."}
        </span>
      )}
    </div>
  );
}
