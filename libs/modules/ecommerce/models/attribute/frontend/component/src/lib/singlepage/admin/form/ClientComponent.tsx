"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/attribute/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/models/attribute/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

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
      boolean: props.data?.boolean || false,
      date: props.data?.date ? new Date(props.data.date) : null,
      datetime: props.data?.datetime ? new Date(props.data.datetime) : null,
      number: props.data?.number || null,
      string: props.data?.string ?? {},
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
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="attribute"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <AgregatedInput title="String">
          {internationalization.languages.map((language) => {
            return (
              <FormField
                key={language.code}
                ui="shadcn"
                type="text"
                name={`string.${language.code}`}
                label={language.title}
                form={form}
                placeholder="Type string value"
              />
            );
          })}
        </AgregatedInput>

        <FormField
          ui="shadcn"
          type="text"
          name="number"
          label="Number"
          form={form}
          placeholder="Type number"
        />

        <FormField
          ui="shadcn"
          type="datetime"
          name="datetime"
          label="Datetime"
          form={form}
          placeholder="Select datetime"
        />

        <FormField
          ui="shadcn"
          type="datetime"
          name="date"
          label="Date"
          form={form}
          placeholder="Select date"
        />

        <FormField
          ui="shadcn"
          type="checkbox"
          name="boolean"
          label="Boolean"
          form={form}
          placeholder="Select boolean"
          className="flex flex-row items-center gap-2"
          inputClassName="w-4"
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

        {props.attributeKeysToAttributes
          ? props.attributeKeysToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.productsToAttributes
          ? props.productsToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.storesToAttributes
          ? props.storesToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.attributesToBillingModuleCurrencies
          ? props.attributesToBillingModuleCurrencies({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
