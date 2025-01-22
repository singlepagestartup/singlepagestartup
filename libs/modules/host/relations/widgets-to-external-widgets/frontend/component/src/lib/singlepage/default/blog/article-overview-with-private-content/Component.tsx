import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as ClientComponent } from "./ClientComponent";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    url: string;
  },
) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-value"
      segment="blog.articles.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

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
                      method: "eq",
                      value: data,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <Article
                    key={index}
                    isServer={props.isServer}
                    variant="overview-with-private-content-default"
                    data={entity}
                  >
                    <Article
                      isServer={props.isServer}
                      data={entity}
                      variant="default"
                    />
                    <ClientComponent isServer={props.isServer} data={entity} />
                  </Article>
                );
              });
            }}
          </Article>
        );
      }}
    </Page>
  );
}
