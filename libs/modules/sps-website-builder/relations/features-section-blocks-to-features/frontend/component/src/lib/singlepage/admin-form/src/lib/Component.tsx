"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/sps-website-builder/relations/features-section-blocks-to-features/sdk/model";
import { api } from "@sps/sps-website-builder/relations/features-section-blocks-to-features/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/admin-form/Component";
import { Component as FeaturesSectionBlockAdminSlectInput } from "@sps/sps-website-builder/models/features-section-block/frontend/component";
import { Component as FeatureAdminSlectInput } from "@sps/sps-website-builder/models/feature/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      featuresSectionBlockId: props.data?.featuresSectionBlockId || "",
      featureId: props.data?.featureId || "",
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
      name="features-section-blocks-to-features"
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

        <FeaturesSectionBlockAdminSlectInput
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="featuresSectionBlockId"
          form={form}
        />

        <FeatureAdminSlectInput
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          formFieldName="featureId"
          variant="admin-select-input"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}