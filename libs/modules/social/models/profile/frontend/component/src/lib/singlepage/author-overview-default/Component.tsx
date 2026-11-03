import { memo } from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import { getLocalizedPlainText } from "../plain-text";
import type {
  IComponentPropsExtended,
  IArticleRowProps,
  IProductRowProps,
} from "./interface";
import { Component as ProfilesToBlogModuleArticles } from "@sps/social/relations/profiles-to-blog-module-articles/frontend/component";
import { Component as ProfilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/frontend/component";
import { Component as ProfilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const name =
    props.data.title?.[props.language] ||
    props.data.title?.en ||
    (ru ? "Автор" : "Author");
  const subtitle = getLocalizedPlainText(props.data.subtitle, props.language);
  const description = getLocalizedPlainText(
    props.data.description,
    props.language,
  );
  return (
    <section
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8",
        props.className,
      )}
    >
      <header className="space-y-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-lg font-semibold text-muted-foreground"
          >
            {name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
            <ProfilesToFileStorageModuleFiles
              isServer={props.isServer}
              variant="find"
              skeleton={null}
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "profileId",
                        method: "eq",
                        value: props.data.id,
                      },
                    ],
                  },
                  orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
                  limit: 1,
                },
              }}
            >
              {({ data }) =>
                data?.map((link) => (
                  <ProfilesToFileStorageModuleFiles
                    key={link.id}
                    isServer={props.isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={props.language}
                    className="absolute inset-0 [&_[data-model=file]]:size-full [&_img]:size-full [&_img]:object-cover"
                  />
                ))
              }
            </ProfilesToFileStorageModuleFiles>
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {name}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {description ? (
          <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ru ? "Статьи" : "Articles"}</h2>
        <ProfilesToBlogModuleArticles
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "profileId", method: "eq", value: props.data.id },
                ],
              },
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
            },
          }}
        >
          {({ data }) =>
            data?.length ? (
              <div className="grid items-stretch gap-5 sm:grid-cols-2">
                {data.map((link) => (
                  <ArticleRow
                    key={link.id}
                    data={link}
                    isServer={props.isServer}
                    language={props.language}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru ? "Статей пока нет." : "No articles yet."}
              </p>
            )
          }
        </ProfilesToBlogModuleArticles>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ru ? "Проекты" : "Projects"}</h2>
        <ProfilesToEcommerceModuleProducts
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "profileId", method: "eq", value: props.data.id },
                ],
              },
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
            },
          }}
        >
          {({ data }) =>
            data?.length ? (
              <div className="grid items-stretch gap-5 sm:grid-cols-2">
                {data.map((link) => (
                  <ProductRow
                    key={link.id}
                    data={link}
                    isServer={props.isServer}
                    language={props.language}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru
                  ? "Публичных проектов пока нет."
                  : "No public projects yet."}
              </p>
            )
          }
        </ProfilesToEcommerceModuleProducts>
      </section>
    </section>
  );
}
const ArticleRow = memo(function ArticleRow(props: IArticleRowProps) {
  return (
    <ProfilesToBlogModuleArticles
      {...props}
      variant="default"
      dataSource="props"
    />
  );
});
const ProductRow = memo(function ProductRow(props: IProductRowProps) {
  return (
    <ProfilesToEcommerceModuleProducts
      {...props}
      variant="default"
      dataSource="props"
    />
  );
});
