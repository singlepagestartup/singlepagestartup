"use client";

import { IComponentPropsExtended } from "../interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({});

export function Component(
  props: IComponentPropsExtended & {
    identity: IIdentity;
  },
) {
  const deleteIdentity = api.identitiesDelete({
    id: props.data.id,
    identityId: props.identity.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit() {
    deleteIdentity.mutate({});
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
        <div className="w-full flex flex-col gap-3 justify-between">
          <p>{props.identity.account}</p>
          <Button variant="destructive" onClick={form.handleSubmit(onSubmit)}>
            Delete
          </Button>
        </div>
      </Form>
    </div>
  );
}
