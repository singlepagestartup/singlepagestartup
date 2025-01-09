"use client";

import { IComponentPropsExtended } from "../interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";

const formSchema = z.object({
  password: z.string().min(8),
  newPassword: z.string().min(8),
});

export function Component(
  props: IComponentPropsExtended & {
    identity: IIdentity;
  },
) {
  const updateIdentity = api.identityUpdate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      newPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    updateIdentity.mutate({
      id: props.data.id,
      identityId: props.identity.id,
      data,
    });
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <div className="w-full flex flex-col gap-3">
          <Identity
            isServer={false}
            hostUrl={props.hostUrl}
            variant="form-field-default"
            form={form}
            field="password"
            type="text"
            data={props.identity}
          />
          <FormField
            ui="shadcn"
            type="password"
            label="New password"
            name="newPassword"
            form={form}
            placeholder="Enter new password"
          />
          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Update
          </Button>
        </div>
      </Form>
    </div>
  );
}
