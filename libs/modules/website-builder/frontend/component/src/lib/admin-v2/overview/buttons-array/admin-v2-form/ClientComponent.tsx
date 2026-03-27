"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/buttons-array/frontend/component";
import { Component as ButtonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/frontend/component";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import { Component as SlidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Button } from "../../button";
import { Component as ButtonsArray } from "../";
import { Component as Feature } from "../../feature";
import { Component as Slide } from "../../slide";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      buttonsArraysToButtons={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ButtonsArraysToButtons
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Buttons array"
            rightModelAdminFormLabel="Button"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <ButtonsArray
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonsArrayId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Button
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "buttonsArrayId",
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
      widgetsToButtonsArrays={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToButtonsArrays
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Buttons array"
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
                <ButtonsArray
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonsArrayId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "buttonsArrayId",
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
      slidesToButtonsArrays={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SlidesToButtonsArrays
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Slide"
            rightModelAdminFormLabel="Buttons array"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <ButtonsArray
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonsArrayId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "buttonsArrayId",
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
      featuresToButtonsArrays={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <FeaturesToButtonsArrays
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Feature"
            rightModelAdminFormLabel="Buttons array"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Feature
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.featureId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <ButtonsArray
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonsArrayId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "buttonsArrayId",
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
