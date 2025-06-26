"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/models/message/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/social/models/message/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
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
      description: props.data?.description || "",
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
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
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="message"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Description"
          name="description"
          form={form}
          placeholder="Type description"
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
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.profilesToMessages
          ? props.profilesToMessages({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.chatsToMessages
          ? props.chatsToMessages({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
