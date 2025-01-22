"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/notification/models/notification/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  statuses,
  methods,
} from "@sps/notification/models/notification/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      data: props.data?.data || "",
      status: props.data?.status || "new",
      title: props.data?.title || "",
      method: props.data?.method || "email",
      reciever: props.data?.reciever || "",
      attachments: props.data?.attachments || "",
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
      name="notification"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Title"
          name="title"
          form={form}
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Data"
          name="data"
          form={form}
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Attachments"
          name="attachments"
          form={form}
          placeholder="Array of attachments"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Reciever"
          name="reciever"
          form={form}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Method"
          name="method"
          form={form}
          placeholder="Select method"
          options={methods.map((method) => [method, method])}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Status"
          name="status"
          form={form}
          placeholder="Select status"
          options={statuses.map((status) => [status, status])}
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

        {props.topicsToNotifications
          ? props.topicsToNotifications({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.notificationsToTemplates
          ? props.notificationsToTemplates({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
