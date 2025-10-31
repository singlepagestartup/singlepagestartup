"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  variants,
  insertSchema,
} from "@sps/website-builder/models/widget/sdk/model";
import { api } from "@sps/website-builder/models/widget/sdk/client";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      title: props.data?.title ?? {},
      subtitle: props.data?.subtitle ?? {},
      description: props.data?.description ?? {},
      slug: props.data?.slug || randomWordsGenerator({ type: "slug" }),
      anchor: props.data?.anchor || "",
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      adminTitle:
        props.data?.adminTitle || randomWordsGenerator({ type: "title" }),
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      updateEntity.mutate({ id: props.data?.id, data });
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="widget"
      status={status}
    >
      <div className="flex flex-col gap-6">
        {" "}
        {props.categoriesToWebsiteBuilderModuleWidgets
          ? props.categoriesToWebsiteBuilderModuleWidgets({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        <FormField
          ui="shadcn"
          type="text"
          label="Admin title"
          name="adminTitle"
          form={form}
          placeholder="Type admin title"
        />
        <AgregatedInput title="Title">
          {internationalization.languages.map((language) => {
            return (
              <FormField
                key={language.code}
                ui="shadcn"
                type="text"
                name={`title.${language.code}`}
                label={language.title}
                form={form}
                placeholder="Type title"
              />
            );
          })}
        </AgregatedInput>
        <AgregatedInput title="Subtitle">
          {internationalization.languages.map((language) => {
            return (
              <FormField
                key={language.code}
                ui="shadcn"
                type="text"
                name={`subtitle.${language.code}`}
                label={language.title}
                form={form}
                placeholder="Type subtitle"
              />
            );
          })}
        </AgregatedInput>
        <AgregatedInput title="Description">
          {internationalization.languages.map((language) => {
            return (
              <FormField
                key={language.code}
                ui="shadcn"
                type="tiptap"
                name={`description.${language.code}`}
                label={language.title}
                form={form}
                placeholder="Type description"
              />
            );
          })}
        </AgregatedInput>
        <FormField
          ui="shadcn"
          type="text"
          label="Slug"
          name="slug"
          form={form}
          placeholder="Type slug"
        />
        <FormField
          ui="shadcn"
          type="text"
          name="anchor"
          label="Anchor"
          form={form}
          placeholder="Type anchor"
        />
        <FormField
          ui="shadcn"
          type="text"
          name="className"
          label="Class name"
          form={form}
          placeholder="Type class name"
        />
        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Select variant"
          options={variants.map((variant) => [variant, variant])}
        />
        {props.widgetsToButtonsArrays
          ? props.widgetsToButtonsArrays({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.widgetsToFeatures
          ? props.widgetsToFeatures({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.widgetsToFileStorageModuleFiles
          ? props.widgetsToFileStorageModuleFiles({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.widgetsToLogotypes
          ? props.widgetsToLogotypes({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.widgetsToSliders
          ? props.widgetsToSliders({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
