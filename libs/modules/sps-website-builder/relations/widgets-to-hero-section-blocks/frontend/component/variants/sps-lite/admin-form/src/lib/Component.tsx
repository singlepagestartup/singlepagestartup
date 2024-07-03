"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IComponentPropsExtended } from "./interface";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, Form } from "@sps/shared-ui-shadcn";
import { useActionTrigger } from "@sps/shared-frontend-hooks";
import { z } from "zod";
import { invalidateServerTag } from "@sps/shared-frontend-client-store";
import { api } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/frontend/api/client";
import { Component as WidgetSpsLiteAdminFormInputs } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/frontend/component/variants/sps-lite/admin-form-inputs";
import { Button } from "@sps/ui-adapter";
import { variants } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/contracts/root";

const formSchema = z.object({
  title: z.string(),
  variant: z.enum(variants).default("default"),
  className: z.string().optional(),
  heroSectionBlockId: z.string().optional(),
  widgetId: z.string().optional(),
});

export function Component(props: IComponentPropsExtended) {
  // useActionTrigger({
  //   storeName: "sps-website-builder/widgets-to-hero-section-blocks",
  //   actionFilter: (action) => {
  //     return (
  //       action.type ===
  //       "widgets-to-hero-section-blocks/executeMutation/fulfilled"
  //     );
  //   },
  //   callbackFunction: async (action) => {
  //     onFinish();
  //   },
  // });

  const [requestId, setRequestId] = useState<string | undefined>();

  const router = useRouter();

  const updateEntity = api.update({
    setRequestId: (requestId) => {
      setRequestId(requestId);
    },
  });
  const createEntity = api.create({
    setRequestId: (requestId) => {
      setRequestId(requestId);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      heroSectionBlockId: props.data?.heroSectionBlockId || "",
      widgetId: props.data?.widgetId || "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (props.data?.id) {
      updateEntity.mutate({ id: props.data?.id, data });
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  async function onFinish() {
    if (updateEntity.data || createEntity.data) {
      // dispatch(api.rtk.util.invalidateTags(["widget"]));
      // invalidateServerTag({ tag: "widget" });

      if (props.setOpen) {
        props.setOpen(false);
      }

      // router.refresh();
    }
  }

  return (
    <div
      data-module="sps-website-builder"
      data-model="widget-to-hero-section-block"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={props.className || ""}
    >
      <Form {...form}>
        <Card className="admin-edit-card">
          <h1 className="admin-edit-card-heading">
            {props.data?.id ? "Edit" : "Create"} widget-to-hero-section-block
          </h1>
          <CardContent className="flex flex-col gap-6 pb-10">
            <WidgetSpsLiteAdminFormInputs
              isServer={false}
              hostUrl={props.hostUrl}
              variant="admin-form-inputs"
              form={form}
              data={props.data}
            />
          </CardContent>
          <div className="admin-edit-card-button-container">
            <Button ui="sps-admin" onClick={form.handleSubmit(onSubmit)}>
              {props.data?.id ? "Update" : "Create"}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  );
}