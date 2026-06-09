"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/models/skill/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/social/models/skill/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
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
      status: props.data?.status || "draft",
      defaultModelSlug: props.data?.defaultModelSlug || "openai/gpt-5-5",
      allowedModelSlugs: props.data?.allowedModelSlugs || [],
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
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="skill"
      status={status}
    >
      <div className="flex flex-col gap-6">
        {" "}
        {props.profilesToSkills
          ? props.profilesToSkills({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
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
          placeholder="Type skill title"
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
          type="textarea"
          rows={18}
          label="Description"
          name="description"
          form={form}
          placeholder="Write markdown instructions"
        />
        <FormField
          ui="shadcn"
          type="select"
          label="Status"
          name="status"
          form={form}
          placeholder="Select status"
          options={[
            ["draft", "draft"],
            ["active", "active"],
            ["archived", "archived"],
          ]}
        />
        <FormField
          ui="shadcn"
          type="text"
          label="Default model slug"
          name="defaultModelSlug"
          form={form}
          placeholder="openai/gpt-5-5"
        />
        <FormField
          ui="shadcn"
          type="text"
          name="className"
          label="Class Name"
          form={form}
          placeholder="Type class name"
        />
        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />
      </div>
    </ParentAdminForm>
  );
}
