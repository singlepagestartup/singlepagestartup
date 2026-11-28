import { Component as Icon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";

export function Component({
  language = "ru",
  backHref = "/framework/services",
  backTarget,
  slots,
  children,
}: IComponentProps = {}) {
  const ru = language === "ru";
  return (
    <section
      data-module="website-builder"
      data-model="widget"
      data-variant="content-service-detail"
      className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <a
        href={backHref}
        target={backTarget}
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <Icon variant="phosphor" name="arrow-left" size={20} />
        {ru ? "Все услуги" : "All services"}
      </a>
      {slots ? (
        <article className="space-y-6">
          <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
            <h1 className="max-w-4xl text-balance text-3xl font-semibold leading-tight sm:text-5xl">
              {slots.heading}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-default-muted-foreground">
              {slots.summary}
            </p>
            {children && (
              <a
                href="#booking"
                className="mt-5 inline-flex min-h-11 w-fit items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {ru ? "Заказать" : "Book now"}
              </a>
            )}
          </header>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8">
              <h2 className="text-xl font-semibold">
                {ru ? "Об услуге" : "About the service"}
              </h2>
              <p className="whitespace-pre-line leading-7 text-muted-foreground">
                {slots.description}
              </p>
            </section>
            <section
              id="booking"
              className="min-w-0 scroll-mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8"
            >
              <h2 className="text-xl font-semibold">
                {ru ? "Заказать услугу" : "Book the service"}
              </h2>
              {slots.price}
              <p className="text-sm leading-6 text-muted-foreground">
                {ru
                  ? "Оплата после того, как вы примете версию в чате заказа."
                  : "Payment is due after you accept a version in the order chat."}
              </p>
              {children}
            </section>
          </div>
        </article>
      ) : (
        <h1 className="text-2xl font-semibold">
          {ru ? "Услуга недоступна" : "Service unavailable"}
        </h1>
      )}
    </section>
  );
}
