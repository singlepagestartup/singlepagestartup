import { Component as Page } from "@sps/host/models/page/frontend/component";
import type { IExternalWidgetProps } from "../interface";
import { Component as SocialModuleWidget } from "@sps/social/models/widget/frontend/component";
export function Component(props: IExternalWidgetProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
      language={props.language}
      url={props.url}
    >
      {({ data: routeParams }) => (
        <SocialModuleWidget
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
          {({ data }) =>
            data?.map((entity) => (
              <SocialModuleWidget
                key={entity.id}
                isServer={props.isServer}
                dataSource="props"
                data={entity}
                language={props.language}
                profileSlug={routeParams?.["social.profiles.slug"]}
                variant={entity.variant as any}
              />
            ))
          }
        </SocialModuleWidget>
      )}
    </Page>
  );
}
