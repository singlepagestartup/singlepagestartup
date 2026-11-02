"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const slides = props.slides ?? [];
  const navigation = props.navigation ?? "arrows";
  const russian = props.language === "ru";
  const [viewportRef, carousel] = useEmblaCarousel({ loop: slides.length > 1 });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!carousel) return;
    const update = () => setSelected(carousel.selectedScrollSnap());
    update();
    carousel.on("select", update);
    carousel.on("reInit", update);
    return () => {
      carousel.off("select", update);
      carousel.off("reInit", update);
    };
  }, [carousel]);
  const previous = useCallback(() => carousel?.scrollPrev(), [carousel]);
  const next = useCallback(() => carousel?.scrollNext(), [carousel]);
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (
        !carousel ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target as HTMLElement;
      if (
        target.closest(
          "input, textarea, select, video, audio, [role=slider], [contenteditable]:not([contenteditable=false])",
        )
      )
        return;
      if (event.key === "ArrowLeft") carousel.scrollPrev();
      else if (event.key === "ArrowRight") carousel.scrollNext();
      else if (event.key === "Home") carousel.scrollTo(0);
      else if (event.key === "End") carousel.scrollTo(slides.length - 1);
      else return;
      event.preventDefault();
    },
    [carousel, slides.length],
  );
  const controlClass =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/95 text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  return (
    <section
      data-module="website-builder"
      data-model="slider"
      data-id={props.data.id}
      data-variant={props.variant}
      aria-label={
        props.data.title?.[props.language] || (russian ? "Галерея" : "Gallery")
      }
      aria-roledescription={russian ? "карусель" : "carousel"}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative min-w-0 w-full space-y-4",
        props.data.className,
        props.className,
      )}
    >
      {slides.length ? (
        <div
          className="overflow-hidden rounded-3xl border border-border bg-card"
          ref={viewportRef}
        >
          <div className="flex touch-pan-y">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription={russian ? "слайд" : "slide"}
                aria-label={`${index + 1} ${russian ? "из" : "of"} ${slides.length}`}
                aria-hidden={selected !== index}
                inert={selected !== index}
              >
                {slide.content}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          {russian ? "Слайды пока не добавлены." : "No slides yet."}
        </div>
      )}
      {slides.length > 1 && navigation === "arrows" ? (
        <div className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={previous}
            className={cn(controlClass, "pointer-events-auto")}
            aria-label={russian ? "Предыдущий слайд" : "Previous slide"}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            className={cn(controlClass, "pointer-events-auto")}
            aria-label={russian ? "Следующий слайд" : "Next slide"}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {slides.length > 1 && navigation !== "arrows" ? (
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label={russian ? "Выбор слайда" : "Choose slide"}
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => carousel?.scrollTo(index)}
              aria-label={`${russian ? "Слайд" : "Slide"} ${index + 1}`}
              aria-current={selected === index ? "true" : undefined}
              className={cn(
                navigation === "numbers"
                  ? controlClass
                  : "inline-flex h-10 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                navigation === "numbers" &&
                  selected === index &&
                  "border-default bg-default text-default-foreground hover:bg-default",
              )}
            >
              {navigation === "numbers" ? (
                index + 1
              ) : (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    selected === index ? "bg-default" : "bg-border",
                  )}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
      {slides.length ? (
        <p className="sr-only" role="status" aria-live="polite">
          {selected + 1} {russian ? "из" : "of"} {slides.length}
        </p>
      ) : null}
    </section>
  );
}
