"use client";

import { IComponentPropsExtended } from "../interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button, Form } from "@sps/shared-ui-shadcn";

const formSchema = z.object({
  quantity: z.number(),
  productId: z.string(),
  storeId: z.string(),
});

export function Component(props: IComponentPropsExtended) {
  const ecommerceProductsCart = api.ecommerceOrderCreate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      productId: props.product.id,
      storeId: props.store.id,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    ecommerceProductsCart.mutate({
      id: props.data.id,
      data,
    });
  }

  useEffect(() => {
    if (ecommerceProductsCart.isSuccess) {
      toast.success("Updated successfully");
    }
  }, [ecommerceProductsCart.isSuccess]);

  return (
    <Form {...form}>
      <div className="flex w-full gap-1">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="secondary"
          className="w-full flex flex-shrink-0"
        >
          Add to cart
        </Button>
      </div>
    </Form>
  );
}
