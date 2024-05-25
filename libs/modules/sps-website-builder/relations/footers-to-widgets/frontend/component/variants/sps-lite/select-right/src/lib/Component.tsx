"use client";

import React from "react";
import { IComponentPropsExtended } from "./interface";
import { Card, CardContent, CardHeader, CardTitle } from "@sps/shadcn";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useActionTrigger } from "@sps/hooks";
import { api } from "@sps/sps-website-builder-relations-footers-to-widgets-frontend-api-client";
import { Component as AdminSelectInput } from "@sps/sps-website-builder-models-widget-frontend-component-variants-sps-lite-admin-select-input";
import { FormField, ModelEntityCard } from "@sps/ui-adapter";

const formSchema = z.object({
  footerId: z.string().min(1),
  widgetId: z.string().min(1),
  direction: z.enum(["default", "reverse"]).default("default"),
  orderIndex: z.number().default(0),
});

export function Component(props: IComponentPropsExtended) {
  const [updateEntity, updateEntityResult] = api.rtk.useUpdateMutation();
  const [createEntity, createEntityResult] = api.rtk.useCreateMutation();
  const [deleteEntity, deleteEntityResult] = api.rtk.useDeleteMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      footerId: props.data?.footerId || props.footerId,
      widgetId: props.data?.widgetId,
      direction: props.data?.direction || "default",
      orderIndex: props.data?.orderIndex || 0,
    },
  });

  const watchData = form.watch();

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!data.footerId || !data.widgetId) {
      return;
    }

    if (props.data?.id) {
      await updateEntity({
        id: props.data.id,
        data,
      });

      return;
    }

    await createEntity({
      data,
    });
  }

  useActionTrigger({
    storeName: "sps-website-builder/footers",
    actionFilter: (action) => {
      return action.type === "footers/executeMutation/fulfilled";
    },
    callbackFunction: async (action) => {
      if (action.payload.id) {
        form.setValue("footerId", action.payload.id);
      }

      form.handleSubmit(onSubmit)();
    },
  });

  return (
    <div
      data-module="sps-website-builder"
      data-relation="footers-to-widgets"
      data-variant={props.variant}
      className=""
    >
      {props.data ? (
        <ModelEntityCard
          onDeleteEntity={() => {
            if (props.data?.id) {
              deleteEntity({ id: props.data.id });
            }
          }}
          data={props.data}
        >
          <div className="flex flex-col col-span-3 gap-0.5">
            <FormField
              ui="shadcn"
              type="select"
              label="Direction"
              name="direction"
              form={form}
              placeholder="Select direction of relation"
              options={[
                ["default", "Default"],
                ["reverse", "Reverse"],
              ]}
            />
            <FormField
              ui="shadcn"
              type="number"
              label="Order index"
              name="orderIndex"
              form={form}
              placeholder="Enter order index"
            />
            <AdminSelectInput
              isServer={false}
              form={form}
              variant="admin-select-input"
              formFieldName="widgetId"
            />
          </div>
        </ModelEntityCard>
      ) : (
        <Card className="overflow-hidden">
          <h3 className="admin-heading-h3 -mt-1 lg:-mt-2 -ml-0.5 lg:-ml-1 pb-4">
            Select entity from widgets
          </h3>
          <CardContent className="flex flex-col gap-6">
            <FormField
              ui="shadcn"
              type="select"
              label="Direction"
              name="direction"
              form={form}
              placeholder="Select direction of relation"
              options={[
                ["default", "Default"],
                ["reverse", "Reverse"],
              ]}
            />
            <FormField
              ui="shadcn"
              type="number"
              label="Order index"
              name="orderIndex"
              form={form}
              placeholder="Enter order index"
            />
            <AdminSelectInput
              isServer={false}
              form={form}
              variant="admin-select-input"
              formFieldName="widgetId"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
