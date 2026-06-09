"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/relations/profiles-to-knowledge-module-documents/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/social/relations/profiles-to-knowledge-module-documents/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Document } from "@sps/knowledge/models/document/frontend/component";

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
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      profileId: props.data?.profileId || "",
      knowledgeModuleDocumentId: props.data?.knowledgeModuleDocumentId || "",
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
      isServer={false}
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="profiles-to-knowledge-module-documents"
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
          label="Class Name"
          name="className"
          form={form}
          placeholder="Type class name"
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
        <Profile
          isServer={props.isServer}
          variant="admin-v2-select-input"
          formFieldName="profileId"
          form={form}
        />
        <Document
          isServer={props.isServer}
          variant="admin-v2-select-input"
          formFieldName="knowledgeModuleDocumentId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
