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
            <Form key={index} {...form}>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                variant="destructive"
                className="w-full flex flex-shrink-0"
              >
                Delete
              </Button>
            </Form>
          );
        });
      }}
    </EcommerceOrdersToProducts>
  );
}
