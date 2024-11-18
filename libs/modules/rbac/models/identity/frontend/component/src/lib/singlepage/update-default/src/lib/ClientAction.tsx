"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/identity/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@sps/shared-ui-shadcn";

const formSchema = z.object({
  password: z.string(),
  newPassword: z.string().min(8),
});

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.changePassword({
    id: props.data?.id || "",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      newPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    updateEntity.mutate({ id: props.data?.id, data });
  }

  return (
    <div
      data-module="rbac"
      data-model="identity"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-full py-10 text-center flex flex-col gap-1"
    >
      <Form {...form}>
        <FormField
          ui="shadcn"
          type="password"
          label="Password"
          name="password"
          form={form}
          placeholder="Enter password"
        />

        <FormField
          ui="shadcn"
          type="password"
          label="New Password"
          name="newPassword"
          form={form}
          placeholder="Enter new password"
        />

        <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
          Update
        </Button>
      </Form>
    </div>
  );
}
