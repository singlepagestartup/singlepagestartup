import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Rbac } from "./rbac/Component";
import { Component as Startup } from "./startup/Component";
import { Component as Ecommerce } from "./ecommerce/Component";
import { Component as WebsiteBuilder } from "./website-builder/Component";
import { Component as Blog } from "./blog/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="widgets-to-external-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className || "")}
    >
      {props.data.externalModule === "rbac" ? (
        <Rbac
          {...props}
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          data={props.data}
        />
      ) : null}

      {/* {props.data.externalModule === "startup" ? (
        <Startup
          {...props}
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          data={props.data}
        />
      ) : null} */}

      {/* {props.data.externalModule === "website-builder" ? (
        <WebsiteBuilder
          {...props}
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          data={props.data}
        />
      ) : null} */}

      {props.data.externalModule === "ecommerce" ? (
        <Ecommerce
          {...props}
          isServer={props.isServer}
          data={props.data}
          hostUrl={props.hostUrl}
        />
      ) : null}

      {/* {props.data.externalModule === "blog" ? (
        <Blog
          {...props}
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          data={props.data}
        />
      ) : null} */}
    </div>
  );
}
