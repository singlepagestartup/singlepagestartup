import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import type { IComponentPropsExtended } from "./interface";

export function Component({
  data,
  language,
  slots,
  children,
  className,
  variant,
}: IComponentPropsExtended) {
  const ru = language === "ru";
  const label = ru
    ? {
        back: "Все услуги",
        unavailable: "Услуга недоступна",
        book: "Заказать",
        about: "Об услуге",
        booking: "Заказать услугу",
      }
    : {
        back: "All services",
        unavailable: "Service unavailable",
        book: "Book now",
        about: "About the service",
        booking: "Book the service",
      };
  return (
    <section
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8",
        data.className,
        className,
      )}
    >
      <Link
        href={saveLanguageContext(
          "/framework/services",
          language,
          internationalization.languages,
        )}
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {label.back}
      </Link>
      {slots?.heading ? (
        <article className="space-y-6">
          <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
            <h1 className="max-w-4xl text-balance text-3xl font-semibold leading-tight sm:text-5xl">
              {slots.heading}
            </h1>
            {slots.summary && (
              <TipTap
                value={slots.summary}
                className="mx-0 mt-4 max-w-2xl text-base leading-7 text-default-muted-foreground [&_p]:m-0"
              />
            )}
            {children && (
              <Link
                href="#booking"
                className="mt-5 inline-flex min-h-11 w-fit items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {label.book}
              </Link>
            )}
          </header>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8">
              <h2 className="text-xl font-semibold">{label.about}</h2>
              {slots.description && (
                <TipTap
                  value={slots.description}
                  className="mx-0 whitespace-pre-line text-base leading-7 text-muted-foreground [&_p]:m-0"
                />
              )}
              {slots.media}
            </section>
            <section
              id="booking"
              className="min-w-0 scroll-mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8"
            >
              <h2 className="text-xl font-semibold">{label.booking}</h2>
              {slots.price && (
                <div className="[&>div>p]:hidden">{slots.price}</div>
              )}
              {slots.note && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {slots.note}
                </p>
              )}
              {children}
            </section>
          </div>
        </article>
      ) : (
        <h1 className="text-2xl font-semibold">{label.unavailable}</h1>
      )}
    </section>
  );
}
