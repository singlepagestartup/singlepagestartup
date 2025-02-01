"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/crm/relations/forms-to-inputs/sdk/model";
import { api } from "@sps/crm/relations/forms-to-inputs/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as Input } from "@sps/crm/models/input/frontend/component";
import { Component as Form } from "@sps/crm/models/form/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      formId: props.data?.formId || "",
      inputId: props.data?.inputId || "",
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
      module="crm"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="forms-to-inputs"
      type="relation"
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

        <Input
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="inputId"
          form={form}
        />

        <Form
          isServer={props.isServer}
          formFieldName="formId"
          variant="admin-select-input"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
