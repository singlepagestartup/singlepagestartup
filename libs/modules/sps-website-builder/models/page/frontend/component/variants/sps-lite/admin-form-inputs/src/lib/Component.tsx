import React from "react";
import { IComponentPropsExtended } from "./interface";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@sps/shadcn";
import { Component as PagesToWidgetsSpsLiteSelectRight } from "@sps/sps-website-builder-relations-pages-to-widgets-frontend-component-variants-sps-lite-select-right";
import { Component as PagesToLayoutsSelectRight } from "@sps/sps-website-builder-relations-pages-to-layouts-frontend-component-variants-sps-lite-select-right";
import { ModelEntitiesListCard } from "@sps/ui-adapter";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-website-builder"
      data-model="page"
      data-variant={props.variant}
      className={`${props.className || ""}`}
    >
      <div className="flex flex-col gap-6">
        <FormField
          control={props.form.control}
          name="title"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Title for page" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={props.form.control}
          name="url"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="URL for page" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <ModelEntitiesListCard title="pages-to-widgets">
          <div className="flex flex-col gap-6">
            {props.data?.pagesToWidgets.map((entity, index) => {
              return (
                <PagesToWidgetsSpsLiteSelectRight
                  key={index}
                  isServer={props.isServer}
                  variant="select-right"
                  pageId={props.data?.id}
                  data={entity}
                />
              );
            })}
            <PagesToWidgetsSpsLiteSelectRight
              isServer={props.isServer}
              variant="select-right"
              pageId={props.data?.id}
              data={undefined}
            />
          </div>
        </ModelEntitiesListCard>
        <ModelEntitiesListCard title="pages-to-layouts">
          <div className="flex flex-col gap-6">
            {props.data?.pagesToLayouts.map((pageToLayout, index) => {
              return (
                <PagesToLayoutsSelectRight
                  key={index}
                  isServer={props.isServer}
                  variant="select-right"
                  pageId={props.data?.id}
                  data={pageToLayout}
                />
              );
            })}
            <PagesToLayoutsSelectRight
              isServer={props.isServer}
              variant="select-right"
              pageId={props.data?.id}
            />
          </div>
        </ModelEntitiesListCard>
      </div>
    </div>
  );
}
