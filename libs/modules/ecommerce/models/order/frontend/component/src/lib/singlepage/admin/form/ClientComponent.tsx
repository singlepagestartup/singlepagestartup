"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/order/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  statuses,
  types,
} from "@sps/ecommerce/models/order/sdk/model";
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
      status: props.data?.status || "new",
      type: props.data?.type || "cart",
      comment: props.data?.comment || "",
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
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="order"
      status={status}
    >
      <div className="flex flex-col gap-6">
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
          type="text"
          label="Comment"
          name="comment"
          form={form}
          placeholder="Type comment"
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Type"
          name="type"
          form={form}
          placeholder="Select type"
          options={types.map((type) => [type, type])}
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

        {props.ordersToProducts
          ? props.ordersToProducts({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.ordersToBillingModuleCurrencies
          ? props.ordersToBillingModuleCurrencies({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.ordersToBillingModulePaymentIntents
          ? props.ordersToBillingModulePaymentIntents({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.ordersToFileStorageModuleFiles
          ? props.ordersToFileStorageModuleFiles({
              data: props.data,
              isServer: props.isServer,
            })
          : null}

        {props.ordersToSocialModuleChats
          ? props.ordersToSocialModuleChats({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
