"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/crm/models/customer/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/crm/models/customer/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      email: props.data?.email || "",
      firstName: props.data?.firstName || "",
      lastName: props.data?.lastName || "",
      phone: props.data?.phone || "",
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
      name="customer"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          name="email"
          label="Email"
          form={form}
          placeholder="Type email"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="firstName"
          label="First Name"
          form={form}
          placeholder="Type firstname"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="lastName"
          label="Last Name"
          form={form}
          placeholder="Type lastname"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="phone"
          label="Phone"
          form={form}
          placeholder="Type phone"
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
      </div>
    </ParentAdminForm>
  );
}
