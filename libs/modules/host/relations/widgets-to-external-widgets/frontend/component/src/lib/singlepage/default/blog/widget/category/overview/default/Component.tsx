import { Component as BlogModuleCategory } from "@sps/blog/models/category/frontend/component";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="blog.categories.slug"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <BlogModuleCategory
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
                  <BlogModuleCategory
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={entity}
                    language={props.language}
                  />
                );
              });
            }}
          </BlogModuleCategory>
        );
      }}
    </HostModulePage>
  );
}
