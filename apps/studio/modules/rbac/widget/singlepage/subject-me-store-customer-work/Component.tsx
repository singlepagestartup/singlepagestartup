"use client";

import { useEffect, useRef } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";

export function Component({
  store,
  screen,
  offer,
  discussion,
  order,
  delivery,
  onBackToOffer,
}: IComponentProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const lastScreen = useRef(screen);

  useEffect(() => {
    if (lastScreen.current !== screen) {
      lastScreen.current = screen;
      screenRef.current?.focus();
    }
  }, [screen]);

  return (
    <main
      data-ds-block="rbac.widget.subject-me-store-customer-work"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-store-customer-work"
      lang="ru"
      className="min-h-screen bg-muted text-foreground"
    >
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <SharedIcon variant="phosphor" name="package" size={20} /> {store}
          </p>
          {screen !== "offer" && screen !== "access-denied" && (
            <button
              type="button"
              onClick={onBackToOffer}
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SharedIcon variant="phosphor" name="arrow-left" size={20} /> К
              предложению
            </button>
          )}
        </div>
      </header>
      <div
        ref={screenRef}
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-5 focus:outline-none sm:px-8 sm:py-9"
      >
        {screen === "offer" && offer}
        {screen === "discussion" && (
          <div className="grid gap-4">
            {discussion}
            {delivery && (
              <div className="lg:w-[41%] lg:justify-self-end">{delivery}</div>
            )}
          </div>
        )}
        {screen === "order" && (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            {order}
            {delivery}
          </div>
        )}
        {screen === "access-denied" && (
          <section className="max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-7">
            <SharedIcon variant="phosphor" name="lock-key" />
            <h1 className="mt-4 text-2xl font-semibold">Заказ недоступен</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Войдите в учётную запись покупателя, чтобы открыть заказ и его
              файлы.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
