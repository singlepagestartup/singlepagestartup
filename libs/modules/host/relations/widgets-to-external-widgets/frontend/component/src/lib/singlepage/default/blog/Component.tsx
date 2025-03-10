import { IComponentPropsExtended } from "../interface";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as ArticlesList } from "./articles-list/Component";
import { Component as ArticleOverviewWithPrivateContent } from "./article-overview-with-private-content/Component";
import { Component as ArticleOverview } from "./article-overview/Component";

export function Component(
  props: IComponentPropsExtended & {
    language: string;
  },
) {
  return (
    <BlogWidget
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.externalWidgetId,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <BlogWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
              language={props.language}
            >
              {entity.variant.includes("articles-list") ? (
                <ArticlesList
                  isServer={props.isServer}
                  language={props.language}
                />
              ) : null}
              {entity.variant.includes("article-overview") ? (
                entity.variant.includes("with-private-content") ? (
                  <ArticleOverviewWithPrivateContent
                    url={props.url}
                    isServer={props.isServer}
                    language={props.language}
                  />
                ) : (
                  <ArticleOverview
                    url={props.url}
                    isServer={props.isServer}
                    language={props.language}
                  />
                )
              ) : null}
            </BlogWidget>
          );
        });
      }}
    </BlogWidget>
  );
}
