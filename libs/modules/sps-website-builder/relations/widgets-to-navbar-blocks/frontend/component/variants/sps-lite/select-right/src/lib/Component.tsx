"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { Card, CardContent, CardHeader, CardTitle } from "@sps/shadcn";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useActionTrigger } from "@sps/hooks";
import { api } from "@sps/sps-website-builder-relations-widgets-to-navbar-blocks-frontend-api-client";
import { Component as AdminSelectInput } from "@sps/sps-website-builder-models-navbar-block-frontend-component-variants-sps-lite-admin-select-input";
import { ModelEntityCard } from "@sps/ui-adapter";

const formSchema = z.object({
  // replace with actual schema key
  widgetId: z.string().min(1),
  // replace with actual schema key
  navbarBlockId: z.string().min(1),
});

export function Component(props: IComponentPropsExtended) {
  const [updateEntity, updateEntityResult] = api.rtk.useUpdateMutation();
  const [createEntity, createEntityResult] = api.rtk.useCreateMutation();
  const [deleteEntity, deleteEntityResult] = api.rtk.useDeleteMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      widgetId: props.data?.widgetId || props.widgetId,
      navbarBlockId: props.data?.navbarBlockId,
    },
  });

  const watchData = form.watch();

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!data.widgetId || !data.navbarBlockId) {
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
    storeName: "sps-website-builder/widgets",
    actionFilter: (action) => {
      return action.type === "widgets/executeMutation/fulfilled";
    },
    callbackFunction: async (action) => {
      if (action.payload.id) {
        form.setValue("widgetId", action.payload.id);
      }

      form.handleSubmit(onSubmit)();
    },
  });

  return (
    <div
      data-module="sps-website-builder"
      data-relation="widgets-to-navbar-blocks"
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
            <AdminSelectInput
              isServer={false}
              form={form}
              variant="admin-select-input"
              formFieldName="navbarBlockId"
              renderField="id"
            />
          </div>
        </ModelEntityCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select entity from navbar-blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSelectInput
              isServer={false}
              form={form}
              variant="admin-select-input"
              formFieldName="navbarBlockId"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
