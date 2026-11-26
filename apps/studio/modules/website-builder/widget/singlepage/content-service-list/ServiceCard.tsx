import { Component as Icon } from "../../../../shared/icon";
import type { IServiceCardProps } from "./interface";

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
      <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        <div className="mt-auto flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0 grow">{price}</div>
          <a
            href={href}
            target={target}
            aria-label={
              ru ? `Подробнее об услуге «${title}»` : `Learn about ${title}`
            }
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {ru ? "Подробнее" : "Details"}
            <Icon variant="phosphor" name="arrow-right" size={20} />
          </a>
        </div>
      </article>
    </li>
  );
}
