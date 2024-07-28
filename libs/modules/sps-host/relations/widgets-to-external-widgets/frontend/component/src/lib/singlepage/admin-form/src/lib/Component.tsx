"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/sps-host/relations/widgets-to-external-widgets/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  externalModules,
  insertSchema,
} from "@sps/sps-host/relations/widgets-to-external-widgets/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/admin-form/Component";
import { Component as WidgetSelectInput } from "@sps/sps-host/models/widget/frontend/component";
import { Component as SpsWebsiteBuilderWidget } from "@sps/sps-website-builder/models/widget/frontend/component";
import { Component as StartupWidget } from "@sps/startup/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      orderIndex: props.data?.orderIndex || 0,
      className: props.data?.className || "",
      widgetId: props.data?.widgetId || "",
      externalModule: props.data?.externalModule || "sps-website-builder",
      externalWidgetId: props.data?.externalWidgetId || "",
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

  const watchData = form.watch();

  return (
    <ParentAdminForm
      module="sps-host"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="widgets-to-external-widgets"
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

        <WidgetSelectInput
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="widgetId"
          form={form}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="External module"
          name="externalModule"
          form={form}
          placeholder="Select external module"
          options={externalModules.map((module) => [module, module])}
        />

        {watchData.externalModule === "sps-website-builder" ? (
          <SpsWebsiteBuilderWidget
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "startup" ? (
          <StartupWidget
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}
      </div>
    </ParentAdminForm>
  );
}