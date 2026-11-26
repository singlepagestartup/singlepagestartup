import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TipTap } from "@sps/shared-ui-shadcn";

import type { IServiceCardProps } from "./interface";

export function ServiceCard({
  title,
  summary,
  href,
  language,
  price,
}: IServiceCardProps) {
  const ru = language === "ru";
  return (
    <li className="min-w-0">
      <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {summary && (
          <TipTap
            value={summary}
            className="text-sm leading-6 text-muted-foreground [&_p]:m-0"
          />
        )}
        <div className="mt-auto flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0 grow [&>div>p]:hidden">{price}</div>
          <Link
            href={href}
            aria-label={
              ru ? `Подробнее об услуге «${title}»` : `Learn about ${title}`
            }
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {ru ? "Подробнее" : "Details"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </article>
    </li>
  );
}
