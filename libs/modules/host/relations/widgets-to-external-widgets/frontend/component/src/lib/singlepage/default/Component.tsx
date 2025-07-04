import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Agent } from "./agent/Component";
import { Component as Analytic } from "./analytic/Component";
import { Component as Billing } from "./billing/Component";
import { Component as Blog } from "./blog/Component";
import { Component as Crm } from "./crm/Component";
import { Component as Ecommerce } from "./ecommerce/Component";
import { Component as FileStorage } from "./file-storage/Component";
import { Component as Notification } from "./notification/Component";
import { Component as Rbac } from "./rbac/Component";
import { Component as Social } from "./social/Component";
import { Component as Startup } from "./startup/Component";
import { Component as WebsiteBuilder } from "./website-builder/Component";

export function Component(props: IComponentPropsExtended) {
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
      {props.data.externalModule === "agent" ? (
        <Agent {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "analytic" ? (
        <Analytic {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "billing" ? (
        <Billing {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "blog" ? (
        <Blog {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "crm" ? (
        <Crm {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "ecommerce" ? (
        <Ecommerce {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "file-storage" ? (
        <FileStorage {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "notification" ? (
        <Notification {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "rbac" ? (
        <Rbac {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "social" ? (
        <Social {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "startup" ? (
        <Startup {...props} isServer={props.isServer} data={props.data} />
      ) : null}

      {props.data.externalModule === "website-builder" ? (
        <WebsiteBuilder
          {...props}
          isServer={props.isServer}
          data={props.data}
        />
      ) : null}
    </div>
  );
}
