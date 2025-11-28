"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/identity/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertSchema } from "@sps/rbac/models/identity/sdk/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormField } from "@sps/ui-adapter";
import { Button, Form } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    createEntity.mutate({
      data,
    });
  }

  useEffect(() => {
    if (createEntity.isSuccess && typeof props.successCallback === "function") {
      props.successCallback(createEntity.data);
    }
  }, [createEntity.isSuccess]);

  return (
    <div
      data-module="rbac"
      data-model="identity"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-3">
          <FormField
            ui="shadcn"
            type="text"
            name="email"
            form={form}
            placeholder="Type your email"
            className="w-full"
          />

          <Button onClick={form.handleSubmit(onSubmit)} variant="primary">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
}
