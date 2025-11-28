import { IComponentProps } from "./interface";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="social.profiles.slug"
      url={props.url}
    >
      {({ data: slug }) => {
        if (!slug) {
          return <></>;
        }

        return (
          <SocialModuleProfile
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
              return data?.map((socialModuleProfile, index) => {
                return (
                  <SocialModuleProfile
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={socialModuleProfile}
                    language={props.language}
                  />
                );
              });
            }}
          </SocialModuleProfile>
        );
      }}
    </HostModulePage>
  );
}
