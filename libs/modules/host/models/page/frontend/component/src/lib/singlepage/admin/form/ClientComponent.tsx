"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/host/models/page/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/host/models/page/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { useRef } from "react";
import { MetadataField } from "@sps/shared-frontend-components/singlepage/admin/metadata-editor/field";

export function Component(props: IComponentPropsExtended) {
  const expectedMetadata = useRef(props.data?.metadata || {});
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      metadata: props.data?.metadata || {},
      description: props.data?.description || "",
      title: props.data?.title || "",
      url: props.data?.url || "/",
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      updateEntity.mutate(
        {
          id: props.data.id,
          data: { ...data, _expectedMetadata: expectedMetadata.current },
        },
        {
          onSuccess: (record) => {
            expectedMetadata.current = record.metadata;
          },
        },
      );
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="host"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="page"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <MetadataField form={form} />
        <FormField
          ui="shadcn"
          type="text"
          name="description"
          label="Description"
          form={form}
        />
        <FormField
          ui="shadcn"
          type="text"
          name="title"
          label="Title"
          form={form}
          placeholder="Type title"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="className"
          label="Class Name"
          form={form}
          placeholder="Type class name"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="url"
          label="Url"
          form={form}
          placeholder="Type url"
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.pagesToLayouts
          ? props.pagesToLayouts({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.pagesToMetadata
          ? props.pagesToMetadata({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.pagesToWidgets
          ? props.pagesToWidgets({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
