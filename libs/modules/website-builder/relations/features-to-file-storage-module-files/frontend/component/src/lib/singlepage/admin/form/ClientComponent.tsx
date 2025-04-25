"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/model";
import { api } from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as Feature } from "@sps/website-builder/models/feature/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
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
      orderIndex: props.data?.orderIndex || 0,
      featureId: props.data?.featureId || "",
      fileStorageModuleFileId: props.data?.fileStorageModuleFileId || "",
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
      name="features-to-file-storage-module-files"
      type="relation"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="number"
          label="Order index"
          name="orderIndex"
          form={form}
          placeholder="Order index"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Class name"
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

        <Feature
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="featureId"
          form={form}
        />

        <FileStorageModuleFile
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="fileStorageModuleFileId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
