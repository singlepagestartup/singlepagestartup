import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/social/relations/widgets-to-website-builder-module-widgets/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={props.className}
    >
      <WidgetsToWebsiteBuilderModuleWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data }) =>
          data?.map((link) => (
            <WidgetsToWebsiteBuilderModuleWidgets
              key={link.id}
              isServer={props.isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={props.language}
            >
              <Profile
                isServer={props.isServer}
                variant="author-overview-default"
                profileId={props.profileId}
                language={props.language}
              />
            </WidgetsToWebsiteBuilderModuleWidgets>
          ))
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
