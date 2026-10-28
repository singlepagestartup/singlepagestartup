import { memo } from "react";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { getLocalizedPlainText } from "../plain-text";
import type { IComponentPropsExtended } from "./interface";
import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";

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
  const avatar = props.data.avatar;
  const src = avatar?.file
    ? /^https?:\/\//.test(avatar.file)
      ? avatar.file
      : `${NEXT_PUBLIC_API_SERVICE_URL}/public${avatar.file}`
    : null;
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
            className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-lg font-semibold text-muted-foreground"
          >
            {src ? (
              <img src={src} alt="" className="size-full object-cover" />
            ) : (
              name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
            )}
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
        <p className="text-xs text-muted-foreground">
          {props.data.articleCount} {ru ? "статей" : "articles"} ·{" "}
          {props.data.productCount} {ru ? "проектов" : "projects"}
        </p>
      </header>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ru ? "Статьи" : "Articles"}</h2>
        {props.data.articles.length ? (
          <div className="grid items-stretch gap-5 sm:grid-cols-2">
            {props.data.articles.map((article) => (
              <ArticleRow
                key={article.id}
                id={article.id}
                isServer={props.isServer}
                language={props.language}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ru ? "Статей пока нет." : "No articles yet."}
          </p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ru ? "Проекты" : "Projects"}</h2>
        {props.data.products.length ? (
          <div className="grid items-stretch gap-5 sm:grid-cols-2">
            {props.data.products.map((product) => (
              <ProductRow
                key={product.id}
                id={product.id}
                isServer={props.isServer}
                language={props.language}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ru ? "Публичных проектов пока нет." : "No public projects yet."}
          </p>
        )}
      </section>
    </section>
  );
}
const ArticleRow = memo(function ArticleRow(props: {
  id: string;
  isServer: boolean;
  language: string;
}) {
  return (
    <BlogModuleArticle
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: { and: [{ column: "id", method: "eq", value: props.id }] },
        },
      }}
    >
      {({ data }) =>
        data?.map((article) => (
          <BlogModuleArticle
            key={article.id}
            isServer={props.isServer}
            variant="default"
            dataSource="props"
            data={article}
            language={props.language}
          />
        ))
      }
    </BlogModuleArticle>
  );
});
const ProductRow = memo(function ProductRow(props: {
  id: string;
  isServer: boolean;
  language: string;
}) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: { and: [{ column: "id", method: "eq", value: props.id }] },
        },
      }}
    >
      {({ data }) =>
        data?.map((product) => (
          <EcommerceModuleProduct
            key={product.id}
            isServer={props.isServer}
            variant="default"
            dataSource="props"
            data={product}
            language={props.language}
          />
        ))
      }
    </EcommerceModuleProduct>
  );
});
