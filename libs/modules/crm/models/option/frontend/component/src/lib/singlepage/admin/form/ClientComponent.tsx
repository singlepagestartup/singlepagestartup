"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/crm/models/option/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/crm/models/option/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";

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
      module="crm"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="option"
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

        <AgregatedInput title="Title">
          {internationalization.languages.map((language) => {
            return (
              <FormField
                key={language.code}
                ui="shadcn"
                type="text"
                name={`title.${language.code}`}
                label={language.title}
                form={form}
                placeholder="Type title"
              />
            );
          })}
        </AgregatedInput>

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
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />
        {props.inputsToOptions
          ? props.inputsToOptions({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
