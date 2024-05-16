"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { Card, CardContent, CardHeader, CardTitle } from "@sps/shadcn";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useActionTrigger } from "@sps/hooks";
import { api } from "@sps/sps-website-builder-relations-hero-section-blocks-to-buttons-frontend-api-client";
import { Component as AdminSelectInput } from "@sps/sps-website-builder-models-button-frontend-component-variants-sps-lite-admin-select-input";

const formSchema = z.object({
  heroSectionBlockId: z.string().min(1),
  buttonId: z.string().min(1),
});

export function Component(props: IComponentPropsExtended) {
  const [updateEntity, updateEntityResult] = api.rtk.useUpdateMutation();
  const [createEntity, createEntityResult] = api.rtk.useCreateMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      heroSectionBlockId:
        props.data?.heroSectionBlockId || props.heroSectionBlockId,
      buttonId: props.data?.buttonId,
    },
  });

  const watchData = form.watch();

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!data.heroSectionBlockId || !data.buttonId) {
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
    // replace with actual schema name
    storeName: "sps-website-builder/hero-section-blocks",
    actionFilter: (action) => {
      return action.type === "hero-section-blocks/executeMutation/fulfilled";
    },
    callbackFunction: async (action) => {
      if (action.payload.id) {
        form.setValue("heroSectionBlockId", action.payload.id);
      }

      form.handleSubmit(onSubmit)();
    },
  });

  return (
    <div
      data-module="sps-website-builder"
      data-relation="hero-section-blocks-to-buttons"
      data-variant={props.variant}
      className=""
    >
      <Card
        className={
          Object.keys(form.formState.errors)?.length ? "border-destructive" : ""
        }
      >
        <CardHeader>
          <CardTitle>Select entity from buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminSelectInput
            isServer={false}
            form={form}
            variant="admin-select-input"
            formFieldName="buttonId"
          />
        </CardContent>
      </Card>
    </div>
  );
}