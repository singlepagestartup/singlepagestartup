"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/models/action/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/social/models/action/sdk/model";
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
      variant: props.data?.variant || "default",
      payload: props.data?.payload || {},
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
      name="action"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.profilesToActions
          ? props.profilesToActions({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.chatsToActions
          ? props.chatsToActions({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
