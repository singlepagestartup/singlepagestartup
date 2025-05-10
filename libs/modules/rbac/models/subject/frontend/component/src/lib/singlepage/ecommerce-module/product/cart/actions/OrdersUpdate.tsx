"use client";

import { IComponentPropsExtended } from "../interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  quantity: z.number(),
});

export function Component(
  props: IComponentPropsExtended & {
    order: IOrder;
  },
) {
  const updateEntity = api.ecommerceModuleOrderUpdate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
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
              {
                column: "productId",
                method: "eq",
                value: props.product.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <Form key={index} {...form}>
              <div className="flex w-full gap-1">
                <EcommerceOrdersToProducts
                  isServer={false}
                  variant="entity-field-default"
                  field="quantity"
                  data={entity}
                  form={form}
                />
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
        });
      }}
    </EcommerceOrdersToProducts>
  );
}
