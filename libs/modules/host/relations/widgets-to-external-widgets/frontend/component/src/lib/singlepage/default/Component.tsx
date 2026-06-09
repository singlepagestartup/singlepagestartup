import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import dynamic from "next/dynamic";

const externalWidgetLoaders = {
  analytic: () =>
    import("./analytic/Component").then((module) => module.Component),
  billing: () =>
    import("./billing/Component").then((module) => module.Component),
  blog: () => import("./blog/Component").then((module) => module.Component),
  crm: () => import("./crm/Component").then((module) => module.Component),
  ecommerce: () =>
    import("./ecommerce/Component").then((module) => module.Component),
  "file-storage": () =>
    import("./file-storage/Component").then((module) => module.Component),
  notification: () =>
    import("./notification/Component").then((module) => module.Component),
  rbac: () => import("./rbac/Component").then((module) => module.Component),
  social: () => import("./social/Component").then((module) => module.Component),
  startup: () =>
    import("./startup/Component").then((module) => module.Component),
  "website-builder": () =>
    import("./website-builder/Component").then((module) => module.Component),
} as const;

const externalWidgetClientComponents = {
  analytic: dynamic(externalWidgetLoaders.analytic),
  billing: dynamic(externalWidgetLoaders.billing),
  blog: dynamic(externalWidgetLoaders.blog),
  crm: dynamic(externalWidgetLoaders.crm),
  ecommerce: dynamic(externalWidgetLoaders.ecommerce),
  "file-storage": dynamic(externalWidgetLoaders["file-storage"]),
  notification: dynamic(externalWidgetLoaders.notification),
  rbac: dynamic(externalWidgetLoaders.rbac),
  social: dynamic(externalWidgetLoaders.social),
  startup: dynamic(externalWidgetLoaders.startup),
  "website-builder": dynamic(externalWidgetLoaders["website-builder"]),
} as const;

async function ServerExternalWidget(props: IComponentPropsExtended) {
  const loadExternalWidget =
    externalWidgetLoaders[
      props.data.externalModule as keyof typeof externalWidgetLoaders
    ];

  if (!loadExternalWidget) {
    return null;
  }

  const ExternalWidgetComponent = await loadExternalWidget();

  return (
    <ExternalWidgetComponent
      {...props}
      isServer={props.isServer}
      data={props.data}
    />
  );
}

export function Component(props: IComponentPropsExtended) {
  const ExternalWidgetComponent =
    externalWidgetClientComponents[
      props.data.externalModule as keyof typeof externalWidgetClientComponents
    ];

  return (
    <div
      data-module="host"
      data-relation="widgets-to-external-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      {props.isServer ? (
        <ServerExternalWidget {...props} />
      ) : ExternalWidgetComponent ? (
        <ExternalWidgetComponent
          {...props}
          isServer={props.isServer}
          data={props.data}
        />
      ) : null}
    </div>
  );
}
