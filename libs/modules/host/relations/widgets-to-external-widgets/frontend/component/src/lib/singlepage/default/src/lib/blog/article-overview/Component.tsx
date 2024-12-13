import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return (
    <Page
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
          <Article
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
                    hostUrl={props.hostUrl}
                    variant="overview-default"
                    data={entity}
                  />
                );
              });
            }}
          </Article>
        );
      }}
    </Page>
  );
}
