"use client";

import { Form, Button } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const formSchema = z.object({});

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  // const createEntity = api.create();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    api
      .create({
        data,
      })
      .then((res) => {
        if (typeof props.successCallback === "function") {
          props.successCallback(res);
        }

        router.refresh();
      });
    // createEntity.mutate({
    //   data,
    // });
  }

  // useEffect(() => {
  //   if (createEntity.isSuccess && typeof props.successCallback === "function") {
  //     props.successCallback(createEntity.data);
  //   }
  // }, [createEntity.isSuccess]);

  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <Button onClick={form.handleSubmit(onSubmit)} variant="primary">
          Add to cart
        </Button>
      </Form>
    </div>
  );
}
