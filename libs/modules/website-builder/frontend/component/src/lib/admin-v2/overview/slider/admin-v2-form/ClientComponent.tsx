"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/slider/frontend/component";
import { Component as SlidersToSlides } from "@sps/website-builder/relations/sliders-to-slides/frontend/component";
import { Component as WidgetsToSliders } from "@sps/website-builder/relations/widgets-to-sliders/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Slide } from "../../slide";
import { Component as Slider } from "../";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      slidersToSlides={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SlidersToSlides
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Slider"
            rightModelAdminFormLabel="Slide"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Slider
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.sliderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Slide
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.slideId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "sliderId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      widgetsToSliders={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToSliders
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Slider"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Widget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.widgetId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Slider
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.sliderId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "sliderId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
