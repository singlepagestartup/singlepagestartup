import { TipTap } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProfilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <div className="w-full flex items-start flex-col gap-5 mx-auto max-w-7xl">
        {props.data?.subtitle ? (
          <h3 className="text-base tracking-tight text-gray-600 sm:text-md md:text-xl max-w-xl">
            {props.data?.subtitle[props.language]}
          </h3>
        ) : null}
        {props.data?.title ? (
          <h1 className="text-4xl font-bold tracking-tight xl:inline text-gray-900 sm:text-5xl md:text-6xl max-w-3xl">
            {props.data?.title[props.language]}
          </h1>
        ) : null}
        {props.data.description?.[props.language] ? (
          <TipTap value={props.data.description[props.language] ?? ""} />
        ) : null}
        <ProfilesToWebsiteBuilderModuleWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "profileId",
                    method: "eq",
                    value: props.data?.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data?.map((profileToWebsiteBuilderModuleWidget, index) => {
              return (
                <ProfilesToWebsiteBuilderModuleWidgets
                  key={index}
                  isServer={props.isServer}
                  variant={profileToWebsiteBuilderModuleWidget.variant as any}
                  data={profileToWebsiteBuilderModuleWidget}
                  language={props.language}
                />
              );
            });
          }}
        </ProfilesToWebsiteBuilderModuleWidgets>
      </div>
    </div>
  );
}
