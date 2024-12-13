import { IComponentPropsExtended } from "../interface";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as ArticlesList } from "./articles-list/Component";
import { Component as ArticleOverviewWithPrivateContent } from "./article-overview-with-private-content/Component";
import { Component as ArticleOverview } from "./article-overview/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <BlogWidget
      isServer={props.isServer}
      hostUrl={props.hostUrl}
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
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            >
              {entity.variant.includes("articles-list") ? (
                <ArticlesList
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                />
              ) : null}
              {entity.variant.includes("article-overview") ? (
                entity.variant.includes("with-private-content") ? (
                  <ArticleOverviewWithPrivateContent
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
                  />
                ) : (
                  <ArticleOverview
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
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
