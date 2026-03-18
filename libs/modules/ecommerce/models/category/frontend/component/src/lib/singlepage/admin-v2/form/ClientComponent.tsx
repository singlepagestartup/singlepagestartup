"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/category/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/models/category/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin-v2/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";
import { useMemo } from "react";
import { ModelFormTabs } from "@sps/ecommerce/frontend/component/src/lib/admin-v2/form-tabs";

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
      variant: props.data?.variant || "default",
      title: props.data?.title || {},
      className: props.data?.className || "",
      slug: props.data?.slug || randomWordsGenerator({ type: "slug" }),
      description: props.data?.description ?? {},
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

  const relationSections = useMemo(() => {
    return [
      {
        id: "categories-to-products",
        title: "Products",
        content: props.categoriesToProducts?.({
          data: props.data,
          isServer: props.isServer,
        }),
      },
      {
        id: "categories-to-file-storage-module-files",
        title: "Files",
        content: props.categoriesToFileStorageModuleWidgets?.({
          data: props.data,
          isServer: props.isServer,
        }),
      },
      {
        id: "widgets-to-categories",
        title: "Widgets",
        content: props.widgetsToCategories?.({
          data: props.data,
          isServer: props.isServer,
        }),
      },
      {
        id: "categories-to-website-builder-module-widgets",
        title: "Website Widgets",
        content: props.categoriesToWebsiteBuilderModuleWidgets?.({
          data: props.data,
          isServer: props.isServer,
        }),
      },
    ].filter(
      (
        section,
      ): section is {
        id: string;
        title: string;
        content: NonNullable<typeof section.content>;
      } => Boolean(section.content),
    );
  }, [
    props.categoriesToProducts,
    props.categoriesToFileStorageModuleWidgets,
    props.widgetsToCategories,
    props.categoriesToWebsiteBuilderModuleWidgets,
    props.data,
    props.isServer,
  ]);

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      isServer={false}
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="category"
      status={status}
    >
      <ModelFormTabs
        relationSections={relationSections}
        details={
          <div className="flex flex-col gap-6">
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
              label="Class Name"
              name="className"
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
          </div>
        }
      />
    </ParentAdminForm>
  );
}
