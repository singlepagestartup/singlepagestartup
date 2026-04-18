import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Button } from "./button";
import { Component as ButtonsArray } from "./buttons-array";
import { Component as Feature } from "./feature";
import { Component as Logotype } from "./logotype";
import { Component as Slide } from "./slide";
import { Component as Slider } from "./slider";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "website-builder");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/website-builder";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Button variant="admin-v2-card" isServer={props.isServer} />
            <ButtonsArray variant="admin-v2-card" isServer={props.isServer} />
            <Feature variant="admin-v2-card" isServer={props.isServer} />
            <Logotype variant="admin-v2-card" isServer={props.isServer} />
            <Slide variant="admin-v2-card" isServer={props.isServer} />
            <Slider variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Button
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <ButtonsArray
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Feature
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Logotype
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Slide
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Slider
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Widget
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
      </div>
    </main>
  );
}
