import { Component as HostPage } from "@sps/host/models/page/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <HostPage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="rbac.subjects.slug"
      url={props.url}
    >
      {({ data: slug }) => {
        if (!slug) {
          return <></>;
        }

        return (
          <RbacModuleSubject
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slug",
                      method: "eq",
                      value: slug,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((subject, index) => {
                return (
                  <RbacModuleSubject
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={subject}
                  />
                );
              });
            }}
          </RbacModuleSubject>
        );
      }}
    </HostPage>
  );
}
