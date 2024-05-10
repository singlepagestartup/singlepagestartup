"use client";

import React, { useEffect, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/sps-website-builder-relations-pages-to-layouts-frontend-api-client";
import { FormProvider, useForm } from "react-hook-form";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@sps/shadcn";
import { Component as LayoutSpsLiteAdminSelectInput } from "@sps/sps-website-builder-models-layout-frontend-component-variants-sps-lite-admin-select-input";
import { useGlobalActionsStore } from "@sps/store";
import { FormField } from "@sps/ui-adapter";

export function Component(props: IComponentPropsExtended) {
  const [triggeredActions, setTriggeredActions] = useState<string[]>();
  const pagesActions = useGlobalActionsStore((store) =>
    store.getActionsFromStoreByName("sps-website-builder/pages"),
  );

  const [updatePagesToLayouts, updatePagesToLayoutsResult] =
    api.rtk.useUpdateMutation();
  const [createPagesToLayouts, createPagesToLayoutsResult] =
    api.rtk.useCreateMutation();

  const methods = useForm<any>({
    mode: "all",
    defaultValues: {
      layoutId: props.data?.[0]?.layoutId,
      pageId: props.pageId,
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = methods;

  const watchData = watch();

  useEffect(() => {
    pagesActions.forEach(async (action: any) => {
      if (
        action.type === "pages/executeMutation/fulfilled" &&
        !triggeredActions?.includes(action.meta.requestId)
      ) {
        if (triggeredActions) {
          setTriggeredActions([...triggeredActions, action.meta.requestId]);
        } else {
          setTriggeredActions([action.meta.requestId]);
        }

        onSubmit(watchData);
      }
    });
  }, [pagesActions, triggeredActions, watchData]);

  // useEffect(() => {
  //   console.log(`🚀 ~ useEffect ~ watchData:`, watchData);
  // }, [watchData]);

  async function onSubmit(data: any) {
    if (props.data?.[0]?.id) {
      await updatePagesToLayouts({
        id: props.data[0].id,
        data,
      });

      return;
    }

    await createPagesToLayouts({
      data: {
        ...data,
        pageId: props.pageId,
      },
    });
  }

  return (
    <div
      data-module="sps-website-builder"
      data-model="pages-to-layouts"
      data-variant={props.variant}
      className=""
    >
      <Card>
        <CardHeader>
          <CardTitle>Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <div className="flex flex-col gap-6">
              <FormField ui="sps" name="order" type="text" label="Order" />
              <LayoutSpsLiteAdminSelectInput
                isServer={false}
                variant="admin-select-input"
                onChange={(value) => {
                  setValue("layoutId", value);
                }}
                value={watchData.layoutId}
              />
              {/* <Button onClick={handleSubmit(onSubmit)}>Create</Button> */}
            </div>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
