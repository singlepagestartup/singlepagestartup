"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/file-storage/models/file/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/file-storage/models/file/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const file = props.data?.file
    ? props.data?.file.includes("https")
      ? props.data.file
      : `${NEXT_PUBLIC_API_SERVICE_URL}/public${props.data?.file}`
    : undefined;

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      adminTitle: props.data?.adminTitle || "",
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      containerClassName: props.data?.containerClassName || "",
      file: file || "",
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
      name="file"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Admin title"
          name="adminTitle"
          form={form}
          placeholder="Type admin title"
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
          type="file"
          label="File"
          name="file"
          form={form}
          placeholder="Select file"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Container class name"
          name="containerClassName"
          form={form}
          placeholder="Type container class name"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Type class name"
        />

        {props.widgetsToFiles
          ? props.widgetsToFiles({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
