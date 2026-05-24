"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/knowledge/models/edit-suggestion/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/knowledge/models/edit-suggestion/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";

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
      slug: props.data?.slug || randomWordsGenerator({ type: "slug" }),
      adminTitle:
        props.data?.adminTitle || randomWordsGenerator({ type: "title" }),
      title: props.data?.title || "",
      description: props.data?.description || "",
      targetDocumentId: props.data?.targetDocumentId || undefined,
      operation: props.data?.operation || "update",
      status: props.data?.status || "pending",
      proposedDescription: props.data?.proposedDescription || "",
      rationale: props.data?.rationale || "",
      metadata: props.data?.metadata || {},
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
      module="knowledge"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="edit-suggestion"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Admin title"
          name="adminTitle"
          form={form}
          placeholder="Type admin title"
        />
        <FormField
          ui="shadcn"
          type="text"
          label="Title"
          name="title"
          form={form}
          placeholder="Type title"
        />
        <FormField
          ui="shadcn"
          type="text"
          label="Slug"
          name="slug"
          form={form}
          placeholder="Type slug"
        />
        <FormField
          ui="shadcn"
          type="text"
          label="Target Document ID"
          name="targetDocumentId"
          form={form}
          placeholder="Document id"
        />
        <FormField
          ui="shadcn"
          type="select"
          label="Operation"
          name="operation"
          form={form}
          placeholder="Select operation"
          options={[
            ["update", "update"],
            ["create", "create"],
          ]}
        />
        <FormField
          ui="shadcn"
          type="select"
          label="Status"
          name="status"
          form={form}
          placeholder="Select status"
          options={[
            ["pending", "pending"],
            ["approved", "approved"],
            ["rejected", "rejected"],
          ]}
        />
        <FormField
          ui="shadcn"
          type="textarea"
          rows={14}
          label="Proposed Description"
          name="proposedDescription"
          form={form}
          placeholder="Write proposed markdown"
        />
        <FormField
          ui="shadcn"
          type="textarea"
          rows={4}
          label="Rationale"
          name="rationale"
          form={form}
          placeholder="Why this edit is useful"
        />
        <FormField
          ui="shadcn"
          type="textarea"
          rows={4}
          label="Description"
          name="description"
          form={form}
          placeholder="Type description"
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
      </div>
    </ParentAdminForm>
  );
}
