"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { api } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { memo, useCallback } from "react";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { createId } from "@paralleldrive/cuid2";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update({
    id: props.data?.id ?? "",
  });
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      storeId: props.data?.storeId || "",
      orderIndex: props.data?.orderIndex || 0,
      sku: props.data?.sku || createId(),
      productId: props.data?.productId || "",
      className: props.data?.className || "",
      configurationKey: props.data?.configurationKey ?? "",
      settings: { quoteMinutes: 15, packages: [], ...props.data?.settings },
    },
  });
  const packages = useFieldArray({
    control: form.control,
    name: "settings.packages",
  });
  const removePackage = useCallback(
    (index: number) => packages.remove(index),
    [packages.remove],
  );

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
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="stores-to-products"
      type="relation"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="SKU"
          name="sku"
          form={form}
          placeholder="Type SKU"
        />
        <FormField
          ui="shadcn"
          type="text"
          label="Configuration key"
          name="configurationKey"
          form={form}
          placeholder="Same product configuration across stores"
        />

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

        <fieldset disabled={Boolean(props.data?.id)} className="grid gap-4">
          <Store
            isServer={props.isServer}
            variant="admin-v2-select-input"
            formFieldName="storeId"
            form={form}
          />

          <Product
            isServer={props.isServer}
            variant="admin-v2-select-input"
            formFieldName="productId"
            form={form}
          />
        </fieldset>
        {props.data?.id && (
          <p className="text-xs text-muted-foreground">
            The Store and Product identify this offer and cannot be reassigned.
          </p>
        )}
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 font-semibold">Receipt and sale rules</legend>
          <label className="grid gap-2 text-sm">
            Receipt method
            <select
              className={settingsField}
              {...form.register("settings.receiptMethod")}
            >
              <option value="shipping">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="electronic">Electronic</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Quote lifetime · minutes
            <input
              className={settingsField}
              type="number"
              min="1"
              max="1440"
              {...form.register("settings.quoteMinutes", {
                valueAsNumber: true,
              })}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("settings.standalone")} />
            Sell this service separately
          </label>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="mb-3 font-semibold">
            External packaging per product unit
          </legend>
          <p className="text-xs text-muted-foreground">
            Box dimensions are in centimetres; gross weight is in kilograms.
          </p>
          {packages.fields.map((box, index) => (
            <PackageRow
              key={box.id}
              index={index}
              register={form.register}
              onRemove={removePackage}
            />
          ))}
          <button
            type="button"
            className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm"
            onClick={() => packages.append({ count: 1 })}
          >
            Add box type
          </button>
        </fieldset>
      </div>
    </ParentAdminForm>
  );
}
const settingsField =
  "min-h-11 min-w-0 rounded-xl border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
interface IPackageRowProps {
  index: number;
  register: UseFormReturn<z.infer<typeof insertSchema>>["register"];
  onRemove: (index: number) => void;
}
const PackageRow = memo(function PackageRow({
  index,
  register,
  onRemove,
}: IPackageRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3 sm:grid-cols-5">
      <label className="grid gap-2 text-sm">
        Box count
        <input
          className={settingsField}
          type="number"
          min="1"
          step="1"
          required
          {...register(`settings.packages.${index}.count`, {
            valueAsNumber: true,
          })}
        />
      </label>
      {(
        [
          { key: "length_cm", title: "Length · cm" },
          { key: "width_cm", title: "Width · cm" },
          { key: "height_cm", title: "Height · cm" },
          { key: "weight_kg", title: "Gross weight · kg" },
        ] as const
      ).map((input) => (
        <label key={input.key} className="grid gap-2 text-sm">
          {input.title}
          <input
            className={settingsField}
            type="number"
            min="0.01"
            step="any"
            {...register(`settings.packages.${index}.${input.key}`, {
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
          />
        </label>
      ))}
      <button
        type="button"
        className="col-span-2 min-h-11 rounded-xl border border-border px-4 py-2 text-sm sm:col-span-5"
        onClick={() => onRemove(index)}
      >
        Remove box type
      </button>
    </div>
  );
});
