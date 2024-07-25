"use client";

import { IComponentPropsExtended } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/sps-website-builder/relations/navbar-blocks-to-buttons-arrays/sdk/model";
import { api } from "@sps/sps-website-builder/relations/navbar-blocks-to-buttons-arrays/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/admin-form/Component";
import { Component as NavbarBlockAdminSlectInput } from "@sps/sps-website-builder/models/navbar-block/frontend/component";
import { Component as ButtonsArrayAdminSelectInput } from "@sps/sps-website-builder/models/buttons-array/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      navbarBlockId: props.data?.navbarBlockId || "",
      buttonsArrayId: props.data?.buttonsArrayId || "",
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
    <ParentAdminForm
      module="sps-website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="navbar-blocks-to-buttons-arrays"
      type="relation"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="number"
          label="Order index"
          name="orderIndex"
          form={form}
          placeholder="Order index"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Class name"
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

        <NavbarBlockAdminSlectInput
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="navbarBlockId"
          form={form}
        />

        <ButtonsArrayAdminSelectInput
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="buttonsArrayId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
