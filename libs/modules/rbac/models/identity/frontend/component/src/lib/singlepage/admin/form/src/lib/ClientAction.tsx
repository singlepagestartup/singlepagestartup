"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/rbac/models/identity/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  providers,
  variants,
  insertSchema,
} from "@sps/rbac/models/identity/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      password: props.data?.password || "",
      account: props.data?.account || "",
      email: props.data?.email || "",
      provider: props.data?.provider || "email_and_password",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      updateEntity.mutate({ id: props.data?.id, data });
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="identity"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Account"
          name="account"
          form={form}
          placeholder="Enter account"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Email"
          name="email"
          form={form}
          placeholder="Enter email"
        />

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
          type="select"
          label="Provider"
          name="provider"
          form={form}
          placeholder="Select provider"
          options={providers.map((provider) => [provider, provider])}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Select variant"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.subjectsToIdentities
          ? props.subjectsToIdentities({
              data: props.data,
              hostUrl: props.hostUrl,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
