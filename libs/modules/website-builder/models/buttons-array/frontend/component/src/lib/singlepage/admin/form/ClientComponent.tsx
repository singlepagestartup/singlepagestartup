"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/website-builder/models/buttons-array/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/website-builder/models/buttons-array/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

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
      className: props.data?.className || "",
      slug: props.data?.slug || "",
      title: props.data?.title ?? {},
      description: props.data?.description ?? {},
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
      variant="admin-form"
      name="buttons-array"
      status={status}
    >
      <div className="flex flex-col gap-6">
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
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Select variant"
          options={variants.map((variant) => [variant, variant])}
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Type class name"
        />

        {props.buttonsArraysToButtons
          ? props.buttonsArraysToButtons({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.widgetsToButtonsArrays
          ? props.widgetsToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.slidesToButtonsArrays
          ? props.slidesToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.featuresToButtonsArrays
          ? props.featuresToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
