import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { ArrowRight } from "lucide-react";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const href = saveLanguageContext(
    `/blog/articles/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
  return (
    <article
      data-module="blog"
      data-model="article"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none",
        props.data.className,
        props.className,
      )}
    >
      <ArticlesToFileStorageModuleFiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "articleId", method: "eq", value: props.data.id },
              ],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data }) =>
          data?.length ? (
            <div className="grid gap-2 overflow-hidden [&_[data-model=file]]:aspect-square [&_[data-model=file]]:overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
              {data.map((link) => (
                <ArticlesToFileStorageModuleFiles
                  key={link.id}
                  isServer={props.isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={props.language}
                />
              ))}
            </div>
          ) : null
        }
      </ArticlesToFileStorageModuleFiles>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="break-words text-2xl font-semibold leading-7 tracking-tight">
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
            className="text-sm leading-6 text-muted-foreground"
          />
        ) : null}
        <Link
          href={href}
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          {props.language === "ru" ? "Читать статью" : "Read article"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
});
