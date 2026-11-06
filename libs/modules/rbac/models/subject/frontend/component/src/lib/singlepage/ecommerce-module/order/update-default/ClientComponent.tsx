"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
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
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ordersToProducts: [],
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setError("");
    try {
      await updateEntity.mutateAsync({
        id: props.data.id,
        orderId: props.ecommerceModuleOrder.id,
        data,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update the order.",
      );
    }
  }

  useEffect(() => {
    if (updateEntity.isSuccess) {
      toast.success("Updated successfully");
    }
  }, [updateEntity.isSuccess]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-2"
      >
        <Subject
          isServer={false}
          variant="ecommerce-module-order-list-default"
          data={props.data}
          language={props.language}
          apiProps={{ params: { includeCartDetails: true } }}
        >
          {({ data: orders }) => {
            const data = orders.find(
              (order) => order.id === props.ecommerceModuleOrder.id,
            )?.cartDetails?.lines;

            return data?.map((entity, index) => {
              return (
                <div key={entity.id} className="flex min-w-0 flex-1 gap-2">
                  <EcommerceOrdersToProducts
                    isServer={false}
                    variant="form-field-default"
                    field="id"
                    dataSource="props"
                    data={entity}
                    form={form}
                    name={`ordersToProducts.${index}.id`}
                    className="hidden"
                  />
                  <EcommerceOrdersToProducts
                    isServer={false}
                    variant="form-field-default"
                    field="quantity"
                    dataSource="props"
                    data={entity}
                    form={form}
                    type="number"
                    name={`ordersToProducts.${index}.quantity`}
                  />
                </div>
              );
            });
          }}
        </Subject>
        {error && (
          <p role="alert" className="w-full text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="secondary"
          className="min-h-10 shrink-0 rounded-xl"
          disabled={updateEntity.isPending}
        >
          {props.language === "ru" ? "Обновить" : "Update"}
        </Button>
      </form>
    </Form>
  );
}
