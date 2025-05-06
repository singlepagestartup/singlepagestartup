import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as ClientComponent } from "./ClientComponent";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="blog.articles.slug"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <BlogModuleArticle
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slug",
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
                  <BlogModuleArticle
                    key={index}
                    isServer={props.isServer}
                    variant="overview-with-private-content-default"
                    data={entity}
                    language={props.language}
                  >
                    <BlogModuleArticle
                      isServer={props.isServer}
                      data={entity}
                      variant="default"
                      language={props.language}
                    />
                    <ClientComponent
                      isServer={props.isServer}
                      data={entity}
                      language={props.language}
                    />
                  </BlogModuleArticle>
                );
              });
            }}
          </BlogModuleArticle>
        );
      }}
    </HostModulePage>
  );
}
