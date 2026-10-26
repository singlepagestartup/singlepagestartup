import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { memo } from "react";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Icon } from "@sps/ui-adapter";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import type { IMediaProps } from "./interface";
function Media({ articleId, language, isServer, guide }: IMediaProps) {
  return (
    <ArticlesToFileStorageModuleFiles
      isServer={isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "articleId", method: "eq", value: articleId },
              {
                column: "variant",
                method: "eq",
                value: guide ? "guide-cover" : "default",
              },
            ],
          },
          orderBy: {
            and: [
              { column: "orderIndex", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
          limit: 1,
        },
      }}
    >
      {({ data: links }) =>
        links?.length ? (
          links.map((link) => (
            <ArticlesToFileStorageModuleFiles
              key={link.id}
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={language}
            />
          ))
        ) : guide ? (
          <Media
            articleId={articleId}
            language={language}
            isServer={isServer}
          />
        ) : null
      }
    </ArticlesToFileStorageModuleFiles>
  );
}
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    const { data, language, isServer } = props;
    const title = data.title?.[language] || data.title?.en;
    const subtitle = data.subtitle?.[language] || data.subtitle?.en;
    const guide = props.layout === "guide";
    const href = saveLanguageContext(
      `/blog/articles/${data.slug}`,
      language,
      internationalization.languages,
    );
    return (
      <article
        data-module="blog"
        data-model="article"
        data-id={data.id}
        data-variant="card"
        data-card-layout={props.layout || "module"}
        className={cn(
          "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground",
          guide ? "p-5" : "p-4",
          data.className,
          props.className,
        )}
      >
        <div
          className={cn(
            "w-full overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-contain",
            guide
              ? "mb-4 aspect-[4/3] rounded-xl bg-default [&_[data-model=file]]:aspect-[4/3]"
              : "aspect-square [&_[data-model=file]]:aspect-square",
          )}
        >
          <Media
            articleId={data.id}
            language={language}
            isServer={isServer}
            guide={guide}
          />
        </div>
        <h3
          className={cn(
            "font-semibold",
            guide ? "mt-3 text-lg" : "mt-2 text-base leading-6",
          )}
        >
          <Link
            href={href}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-foreground"
          >
            {title}
          </Link>
        </h3>
        {!guide && subtitle ? (
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            <TipTap value={subtitle} />
          </div>
        ) : null}
        {guide ? (
          <span className="mt-5 inline-flex items-center gap-2 text-sm">
            {language === "ru" ? "Как работает модуль" : "Explore the module"}
            <Icon name="arrow-right" size={20} />
          </span>
        ) : null}
      </article>
    );
  },
);
