"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as EcommerceModuleOrderListOrdersToProductsDefault } from "../list/orders-to-products-default";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@sps/shared-frontend-client-utils";

const formSchema = z.object({});

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.ecommerceModuleOrderDelete({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    deleteEntity.mutate({
      id: props.data.id,
      orderId: props.order.id,
    });
  }

  useEffect(() => {
    if (deleteEntity.isSuccess) {
      toast.success("Deleted successfully");
    }
  }, [deleteEntity.isSuccess]);

  return (
    <EcommerceModuleOrderListOrdersToProductsDefault
      isServer={false}
      variant="ecommerce-module-order-list-orders-to-products-default"
      data={props.data}
      language={props.language}
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
            <Form key={index} {...form}>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                variant="destructive"
                className={cn("w-full flex shrink-0", props.className)}
              >
                Delete
              </Button>
            </Form>
          );
        });
      }}
    </EcommerceModuleOrderListOrdersToProductsDefault>
  );
}
