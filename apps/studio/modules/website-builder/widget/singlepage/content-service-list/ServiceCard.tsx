import { Component as Icon } from "../../../../shared/icon";
import type { IServiceCardProps } from "./interface";

const interactiveSlotClassName =
  "[&_:is(a[href],button,input,select,textarea,label,summary,[tabindex],[contenteditable])]:relative [&_:is(a[href],button,input,select,textarea,label,summary,[tabindex],[contenteditable])]:z-10";

export function ServiceCard({
  title,
  summary,
  href,
  target,
  language,
  price,
}: IServiceCardProps) {
  const ru = language === "ru";
  return (
    <li className="min-w-0">
      <article className="relative isolate flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {summary && (
          <div
            className={`text-sm leading-6 text-muted-foreground [&_a]:underline [&_a]:underline-offset-2 ${interactiveSlotClassName}`}
          >
            {summary}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className={`min-w-0 grow ${interactiveSlotClassName}`}>
            {price}
          </div>
          <a
            href={href}
            target={target}
            aria-label={
              ru ? `Подробнее об услуге «${title}»` : `Learn about ${title}`
            }
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted after:absolute after:inset-0 after:z-[1] after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
          >
            {ru ? "Подробнее" : "Details"}
            <Icon variant="phosphor" name="arrow-right" size={20} />
          </a>
        </div>
      </article>
    </li>
  );
}
