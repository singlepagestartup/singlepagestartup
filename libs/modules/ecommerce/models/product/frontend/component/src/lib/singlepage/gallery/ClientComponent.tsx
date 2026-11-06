"use client";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IGalleryClientProps } from "./interface";
export function Component(props: IGalleryClientProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const index = Math.max(
    0,
    props.items.findIndex((item) => item.id === selectedId),
  );
  const change = useCallback(
    (step: number) =>
      setSelectedId(
        props.items[(index + step + props.items.length) % props.items.length]
          ?.id,
      ),
    [index, props.items],
  );
  const current = props.items[index];
  if (!current) return null;
  return (
    <section
      aria-label={
        props.language === "ru"
          ? `Галерея: ${props.title}`
          : `Gallery: ${props.title}`
      }
      data-module="ecommerce"
      data-model="product"
      data-id={props.id}
      data-variant="gallery"
      className={cn("min-w-0 space-y-3", props.className)}
    >
      <div
        className="group relative flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-muted [&_img]:!object-cover [&_[data-model=file]]:h-full"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest(
              "input,textarea,select,video,audio,[contenteditable=true]",
            )
          )
            return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            change(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            change(1);
          }
          if (event.key === "Home") {
            event.preventDefault();
            setSelectedId(props.items[0]?.id);
          }
          if (event.key === "End") {
            event.preventDefault();
            setSelectedId(props.items.at(-1)?.id);
          }
        }}
      >
        <div
          key={current.id}
          className="flex h-full w-full min-w-0 items-center justify-center [&>div]:h-full [&>div]:w-full"
        >
          {current.content}
        </div>
        {props.items.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-2 rounded-2xl bg-card/80 p-1.5 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0">
            <button
              type="button"
              aria-label={
                props.language === "ru" ? "Предыдущее медиа" : "Previous media"
              }
              onClick={() => change(-1)}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={
                props.language === "ru" ? "Следующее медиа" : "Next media"
              }
              onClick={() => change(1)}
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
      {props.items.length > 1 && (
        <div
          className="flex min-w-0 gap-2 overflow-x-auto pb-1"
          aria-label={
            props.language === "ru" ? "Выбрать медиа" : "Choose media"
          }
        >
          {props.items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${props.language === "ru" ? "Медиа" : "Media"} ${i + 1}: ${item.label}`}
              aria-pressed={current.id === item.id}
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-muted focus-visible:outline-2 focus-visible:outline-offset-2",
                current.id === item.id
                  ? "border-foreground"
                  : "border-transparent",
              )}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText size={20} />
              )}
            </button>
          ))}
        </div>
      )}
      <p role="status" className="sr-only">
        {index + 1} / {props.items.length}
      </p>
    </section>
  );
}
