"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/host/relations/widgets-to-external-widgets/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  externalModules,
  variants,
  insertSchema,
} from "@sps/host/relations/widgets-to-external-widgets/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as WidgetSelectInput } from "@sps/host/models/widget/frontend/component";
import { Component as WebsiteBuilder } from "@sps/website-builder/models/widget/frontend/component";
import { Component as Startup } from "@sps/startup/models/widget/frontend/component";
import { Component as Rbac } from "@sps/rbac/models/widget/frontend/component";
import { Component as Billing } from "@sps/billing/models/widget/frontend/component";
import { Component as Ecommerce } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as Blog } from "@sps/blog/models/widget/frontend/component";
import { Component as Crm } from "@sps/crm/models/widget/frontend/component";
import { Component as Social } from "@sps/social/models/widget/frontend/component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      orderIndex: props.data?.orderIndex || 0,
      className: props.data?.className || "",
      widgetId: props.data?.widgetId || "",
      externalModule: props.data?.externalModule || "website-builder",
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
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="host"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="widgets-to-external-widgets"
      type="relation"
      status={status}
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

        {watchData.externalModule === "website-builder" ? (
          <WebsiteBuilder
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "startup" ? (
          <Startup
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "rbac" ? (
          <Rbac
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "billing" ? (
          <Billing
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "ecommerce" ? (
          <Ecommerce
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "blog" ? (
          <Blog
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "crm" ? (
          <Crm
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}

        {watchData.externalModule === "social" ? (
          <Social
            isServer={props.isServer}
            variant="admin-select-input"
            form={form}
            formFieldName="externalWidgetId"
          />
        ) : null}
      </div>
    </ParentAdminForm>
  );
}
