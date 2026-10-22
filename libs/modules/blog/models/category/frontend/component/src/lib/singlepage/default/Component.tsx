import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { ArrowRight } from "lucide-react";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const href = saveLanguageContext(
    `/blog/categories/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
  return (
    <article
      data-module="blog"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5",
        props.data.className,
        props.className,
      )}
    >
      <h3 className="break-words text-xl font-semibold leading-6 tracking-tight">
        <Link
          href={href}
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          {props.data.title?.[props.language] || props.data.title?.en}
        </Link>
      </h3>
      {props.data.subtitle?.[props.language] || props.data.subtitle?.en ? (
        <TipTap
          value={
            props.data.subtitle?.[props.language] ||
            props.data.subtitle?.en ||
            ""
          }
          className="my-3 text-sm leading-6 text-muted-foreground"
        />
      ) : null}
      {props.children}
      <Link
        href={href}
        className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded pt-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      >
        {props.language === "ru" ? "Открыть категорию" : "Explore category"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  );
});
