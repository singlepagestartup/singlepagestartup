import { notFound } from "next/navigation";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import type {
  IContentProps,
  INavigationProps,
  INeighborProps,
} from "./interface";

/** Navigate a stable persisted ID sequence without rounding database timestamps. */
function Neighbor(props: INeighborProps) {
  if (!props.data.id) return null;
  const previous = props.direction === "previous";
  return (
    <Article
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: previous ? "lt" : "gt",
                value: props.data.id,
              },
            ],
          },
          orderBy: {
            and: [{ column: "id", method: previous ? "desc" : "asc" }],
          },
          limit: 1,
        },
      }}
    >
      {({ data }) => {
        const neighbor = data?.find((article) => article.id !== props.data.id);
        return neighbor ? (
          <NeighborLink
            data={neighbor}
            language={props.language}
            direction={props.direction}
          />
        ) : null;
      }}
    </Article>
  );
}
function NeighborLink(
  props: Pick<INeighborProps, "data" | "language" | "direction">,
) {
  if (!props.data.slug) return null;
  const ru = props.language === "ru";
  return (
    <Link
      href={saveLanguageContext(
        `/blog/articles/${props.data.slug}`,
        props.language,
        internationalization.languages,
      )}
      className="block min-w-0 rounded-2xl border border-border bg-card p-6 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <span className="text-sm text-muted-foreground">
        {props.direction === "previous"
          ? ru
            ? "Предыдущая статья"
            : "Previous article"
          : ru
            ? "Следующая статья"
            : "Next article"}
      </span>
      <p className="mt-3 break-words text-lg font-semibold leading-7">
        {props.data.title?.[props.language] ||
          props.data.title?.en ||
          (ru ? "Статья" : "Article")}
      </p>
    </Link>
  );
}
function Navigation(props: INavigationProps) {
  if (!props.data.id) return null;
  return (
    <nav
      aria-label={
        props.language === "ru" ? "Статьи журнала" : "Browse the journal"
      }
      className="grid min-w-0 gap-4 sm:grid-cols-2"
    >
      <Neighbor
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        direction="previous"
      />
      <Neighbor
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        direction="next"
      />
    </nav>
  );
}

export function Component(props: IContentProps) {
  if (!props.articleSlug) return null;
  return (
    <Article
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: props.articleSlug }],
          },
        },
      }}
    >
      {({ data }) => {
        if (data?.length === 0) notFound();
        return data?.map((entity) => (
          <Article
            key={entity.id}
            isServer={props.isServer}
            variant={
              props.articleVariant ??
              (entity.variant === "overview-with-private-content-default"
                ? "overview-with-private-content-default"
                : "overview-default")
            }
            dataSource="props"
            data={entity}
            language={props.language}
            author={props.renderAuthor?.({
              data: entity,
              size: "sm",
              inverse: false,
            })}
            authorCard={props.renderAuthorCard?.({
              data: entity,
              size: "sm",
              inverse: false,
            })}
            commentsContent={props.renderCommentsContent?.({ data: entity })}
            navigation={
              props.renderNavigation ? (
                props.renderNavigation({ data: entity })
              ) : (
                <Navigation
                  isServer={props.isServer}
                  language={props.language}
                  data={entity}
                />
              )
            }
          >
            {(props.articleVariant ?? entity.variant) ===
            "overview-with-private-content-default"
              ? props.renderContent?.({ data: entity })
              : undefined}
          </Article>
        ));
      }}
    </Article>
  );
}
