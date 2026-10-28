import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Categories } from "../default/Categories";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  const createdAt =
    props.data.createdAt instanceof Date
      ? props.data.createdAt
      : new Date(String(props.data.createdAt));
  const hasDate = !Number.isNaN(createdAt.getTime());
  const subtitle =
    props.data.subtitle?.[props.language] || props.data.subtitle?.en;
  const description =
    props.data.description?.[props.language] || props.data.description?.en;
  return (
    <ClientComponent
      articleId={props.data.id}
      variant={props.variant}
      language={props.language}
      title={
        props.data.title?.[props.language] ||
        props.data.title?.en ||
        (props.language === "ru" ? "Статья" : "Article")
      }
      className={cn(props.data.className, props.className)}
      dateTime={hasDate ? createdAt.toISOString() : undefined}
      dateLabel={
        hasDate
          ? createdAt.toLocaleDateString(props.language, {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })
          : undefined
      }
      categories={
        <Categories
          isServer={props.isServer}
          articleId={props.data.id}
          language={props.language}
        />
      }
      subtitle={
        subtitle ? (
          <TipTap
            value={subtitle}
            className="text-lg leading-8 text-muted-foreground"
          />
        ) : undefined
      }
      author={props.author}
      authorCard={props.authorCard}
      navigation={props.navigation}
      commentsContent={props.commentsContent}
      media={
        <ArticlesToFileStorageModuleFiles
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
            data?.length ? (
              <div className="mx-auto grid w-full max-w-lg min-w-0 gap-4 overflow-hidden rounded-2xl [&_[data-model=file]]:min-w-0 [&_img]:w-full">
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
      }
      body={description ? <TipTap value={description} /> : undefined}
      content={props.children}
      publicContent={
        props.children ? undefined : (
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
        )
      }
    />
  );
}
