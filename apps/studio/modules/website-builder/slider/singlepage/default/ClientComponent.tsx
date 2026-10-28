"use client";
import { useCallback, useState } from "react";
import type { IComponentProps } from "./interface";
import { Component as Slide } from "../../../slide";
import { Component as SharedIcon } from "../../../../shared/icon";

export function Component({
  label,
  slides = [],
  navigation = "arrows",
}: IComponentProps) {
  const [active, setActive] = useState(0);
  const total = slides.length;
  const index = Math.min(active, Math.max(0, total - 1));
  const change = useCallback(
    (step: number) => {
      setActive(
        (current) => (Math.min(current, total - 1) + step + total) % total,
      );
    },
    [total],
  );
  if (!total)
    return (
      <p
        data-module="website-builder"
        data-model="slider"
        data-variant="default"
        role="status"
        className="p-8"
      >
        No slides to display.
      </p>
    );
  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      data-module="website-builder"
      data-model="slider"
      data-variant="default"
      data-ds-block="website-builder.slider.default"
      data-ds-layer="singlepage"
      data-navigation={navigation}
      className="min-w-0 space-y-4 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      onKeyDown={(event) => {
        if (event.defaultPrevented || total < 2) return;
        if (
          event.target instanceof HTMLElement &&
          event.target.closest("input,textarea,select,[contenteditable=true]")
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
          setActive(0);
        }
        if (event.key === "End") {
          event.preventDefault();
          setActive(total - 1);
        }
      }}
    >
      <div className="group relative min-w-0">
        <div aria-live="polite" aria-atomic="true">
          <Slide {...slides[index]} variant="default" />
        </div>
        {total > 1 && navigation === "arrows" ? (
          <div
            className="absolute bottom-4 right-4 flex gap-2 rounded-2xl bg-card/80 p-1.5 opacity-100 backdrop-blur-sm transition-opacity motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100 sm:bottom-6 sm:right-6 [@media(hover:hover)]:opacity-0"
            aria-label="Slide navigation"
          >
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => change(-1)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <SharedIcon variant="phosphor" name="arrow-left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => change(1)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <SharedIcon variant="phosphor" name="arrow-right" />
            </button>
          </div>
        ) : null}
      </div>
      {total > 1 && navigation !== "arrows" ? (
        <div className="flex justify-center gap-2" aria-label="Choose slide">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setActive(i)}
              className={
                navigation === "numbers"
                  ? `inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${index === i ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground"}`
                  : "group inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              }
            >
              {navigation === "numbers" ? (
                i + 1
              ) : (
                <span
                  aria-hidden="true"
                  className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === i ? "w-6 bg-foreground" : "w-2 bg-muted-foreground/40 group-hover:bg-muted-foreground"}`}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
      <p role="status" className="sr-only">
        Slide {index + 1} of {total}
      </p>
    </section>
  );
}
