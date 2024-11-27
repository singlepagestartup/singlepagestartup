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

const formSchema = z.object({
  email: z.string().email(),
});

export function Component(
  props: IComponentPropsExtended & {
    identity: IIdentity;
  },
) {
  const updateIdentity = api.identitiesUpdate({
    id: props.data.id,
    identityId: props.identity.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    updateIdentity.mutate({ data });
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
            field="email"
            type="text"
            fill={true}
            data={props.identity}
          />
          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Update
          </Button>
        </div>
      </Form>
    </div>
  );
}
