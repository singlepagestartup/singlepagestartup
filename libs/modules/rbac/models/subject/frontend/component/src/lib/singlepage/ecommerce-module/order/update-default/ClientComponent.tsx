"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  ordersToProducts: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
    }),
  ),
});

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.ecommerceModuleOrderUpdate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ordersToProducts: [],
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    updateEntity.mutate({
      id: props.data.id,
      orderId: props.order.id,
      data,
    });
  }

  useEffect(() => {
    if (updateEntity.isSuccess) {
      toast.success("Updated successfully");
    }
  }, [updateEntity.isSuccess]);

  return (
    <Form {...form}>
      <div className="flex flex-row gap-1">
        <EcommerceOrdersToProducts
          isServer={false}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "orderId",
                    method: "eq",
                    value: props.order.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data?.map((entity, index) => {
              return (
                <div key={index} className="flex w-full gap-1">
                  <EcommerceOrdersToProducts
                    isServer={false}
                    variant="form-field-default"
                    field="id"
                    data={entity}
                    form={form}
                    name={`ordersToProducts.${index}.id`}
                    className="hidden"
                  />
                  <EcommerceOrdersToProducts
                    isServer={false}
                    variant="form-field-default"
                    field="quantity"
                    data={entity}
                    form={form}
                    type="number"
                    name={`ordersToProducts.${index}.quantity`}
                  />
                </div>
              );
            });
          }}
        </EcommerceOrdersToProducts>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="secondary"
          className="w-fit flex flex-shrink-0"
        >
          Update
        </Button>
      </div>
    </Form>
  );
}
