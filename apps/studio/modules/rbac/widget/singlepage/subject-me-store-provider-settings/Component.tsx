"use client";

import { Component as Icon } from "../../../../shared/icon";
import { ConnectionSettings } from "./ConnectionSettings";
import { SpendOverview } from "./SpendOverview";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <main lang="ru" className="min-h-screen bg-muted text-foreground">
      {props.access === "denied" ? (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9">
          <section className="max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-7">
            <Icon variant="phosphor" name="lock-key" />
            <h1 className="mt-4 text-2xl font-semibold">
              Настройки недоступны
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Управлять подключениями и бюджетами может владелец магазина.
            </p>
          </section>
        </div>
      ) : (
        <>
          <header className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-8">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon variant="phosphor" name="package" size={20} />{" "}
                {props.store}
              </p>
              <p className="text-sm text-muted-foreground">
                Рабочее место владельца
              </p>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Подключения и бюджет
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Назначьте агента для внешних вызовов и проверьте расходы по задаче{" "}
              {props.budget.taskId}.
            </p>
            <section
              aria-label="Кошельки агентов"
              className="mt-5 grid gap-2 sm:grid-cols-3"
            >
              {[
                {
                  id: "assistant",
                  name: props.assistant.name,
                  wallet: props.assistant.wallet,
                  detail: "Личный ассистент",
                },
                ...props.subjects.map(({ id, name, wallet, provider }) => ({
                  id,
                  name,
                  wallet,
                  detail: `${provider} · технический агент`,
                })),
              ].map(({ id, name, wallet, detail }) => (
                <div
                  key={id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                  <p className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums">
                    <Icon
                      variant="phosphor"
                      name="wallet"
                      size={20}
                      className="text-muted-foreground"
                    />{" "}
                    {wallet} SPS
                  </p>
                </div>
              ))}
            </section>
            <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <ConnectionSettings {...props} />
              <SpendOverview {...props} />
            </div>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {props.feedback}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
