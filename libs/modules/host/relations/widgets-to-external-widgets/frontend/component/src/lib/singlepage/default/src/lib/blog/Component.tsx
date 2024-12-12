import { IComponentPropsExtended } from "../interface";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as ClientComponent } from "./ClientComponent";

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
          if (entity.variant === "article-overview-default") {
            return (
              <Page
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="url-segment-value"
                segment="blog.articles.id"
              >
                {({ data }) => {
                  if (!data) {
                    return;
                  }

                  return (
                    <BlogWidget
                      isServer={props.isServer}
                      hostUrl={props.hostUrl}
                      variant="article-overview-default"
                      id={data}
                      data={entity}
                    />
                  );
                }}
              </Page>
            );
          }

          return (
            <ClientComponent
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              widget={entity}
            ></ClientComponent>
          );
        });
      }}
    </BlogWidget>
  );
}
