import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
export function Component(props: IComponentPropsExtended) {
  return (
    <article
      data-module="blog"
      data-model="article"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
        <h1 className="max-w-4xl break-words text-3xl font-semibold tracking-tight sm:text-5xl">
          {props.data.title?.[props.language] || props.data.title?.en}
        </h1>
        {props.data.subtitle?.[props.language] || props.data.subtitle?.en ? (
          <TipTap
            value={
              props.data.subtitle?.[props.language] ||
              props.data.subtitle?.en ||
              ""
            }
            className="mt-5 max-w-3xl text-lg leading-8 text-default-muted-foreground"
          />
        ) : null}
      </header>
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
            <div className="grid min-w-0 gap-4 overflow-hidden rounded-3xl [&_img]:w-full">
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
      {props.data.description?.[props.language] ||
      props.data.description?.en ? (
        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <TipTap
            value={
              props.data.description?.[props.language] ||
              props.data.description?.en ||
              ""
            }
          />
        </div>
      ) : null}
      {props.children ?? (
        <ArticlesToWebsiteBuilderModuleWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "articleId", method: "eq", value: props.data.id },
                  { column: "variant", method: "eq", value: "default" },
                ],
              },
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
            },
          }}
        >
          {({ data }) =>
            data?.map((link) => (
              <ArticlesToWebsiteBuilderModuleWidgets
                key={link.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={props.language}
              />
            ))
          }
        </ArticlesToWebsiteBuilderModuleWidgets>
      )}
    </article>
  );
}
