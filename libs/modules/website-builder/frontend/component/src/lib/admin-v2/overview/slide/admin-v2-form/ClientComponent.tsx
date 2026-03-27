"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/slide/frontend/component";
import { Component as SlidersToSlides } from "@sps/website-builder/relations/sliders-to-slides/frontend/component";
import { Component as SlidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component";
import { Component as SlidesToSpsFileStorageModuleWidgets } from "@sps/website-builder/relations/slides-to-file-storage-module-files/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as ButtonsArray } from "../../buttons-array";
import { Component as Slide } from "../";
import { Component as Slider } from "../../slider";

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
                      column: "slideId",
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
                      column: "slideId",
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
      slidesToSpsFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SlidesToSpsFileStorageModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Slide"
            rightModelAdminFormLabel="File"
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
                <FileStorageFile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slideId",
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
