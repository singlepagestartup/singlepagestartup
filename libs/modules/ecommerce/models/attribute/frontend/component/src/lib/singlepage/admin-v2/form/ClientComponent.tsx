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
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import { useEffect, useMemo, useState } from "react";

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
      adminTitle:
        props.data?.adminTitle ||
        randomWordsGenerator({
          type: "title",
        }),
      slug:
        props.data?.slug ||
        randomWordsGenerator({
          type: "slug",
        }),
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

  const relationSections = useMemo(() => {
    return [
      {
        id: "attribute-keys-to-attributes",
        title: "Attribute Keys",
        render: props.attributeKeysToAttributes,
      },
      {
        id: "products-to-attributes",
        title: "Products",
        render: props.productsToAttributes,
      },
      {
        id: "stores-to-attributes",
        title: "Stores",
        render: props.storesToAttributes,
      },
      {
        id: "attributes-to-billing-module-currencies",
        title: "Currencies",
        render: props.attributesToBillingModuleCurrencies,
      },
    ].filter(
      (
        section,
      ): section is {
        id: string;
        title: string;
        render: NonNullable<typeof section.render>;
      } => Boolean(section.render),
    );
  }, [
    props.attributeKeysToAttributes,
    props.productsToAttributes,
    props.storesToAttributes,
    props.attributesToBillingModuleCurrencies,
  ]);

  const [activeMainTab, setActiveMainTab] = useState<"details" | "relations">(
    "details",
  );
  const [activeRelationTab, setActiveRelationTab] = useState(
    relationSections[0]?.id || "",
  );

  useEffect(() => {
    if (!relationSections.length) {
      setActiveRelationTab("");
      if (activeMainTab === "relations") {
        setActiveMainTab("details");
      }
      return;
    }

    if (!relationSections.some((section) => section.id === activeRelationTab)) {
      setActiveRelationTab(relationSections[0].id);
    }
  }, [relationSections, activeRelationTab, activeMainTab]);

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
      <Tabs
        value={activeMainTab}
        onValueChange={(value) => {
          setActiveMainTab(value as "details" | "relations");
        }}
        className="-mt-6"
      >
        <div className="-mx-6 border-b border-border bg-slate-50 px-6 py-4">
          <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
            <TabsTrigger
              value="details"
              className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="relations"
              className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
              disabled={!relationSections.length}
            >
              Relations
              <span className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-sm">
                {relationSections.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-0 pt-6">
          <div className="flex flex-col gap-6">
            <FormField
              ui="shadcn"
              type="text"
              name="adminTitle"
              label="Admin title"
              form={form}
              placeholder="Type admin title"
            />

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
              name="slug"
              label="Slug"
              form={form}
              placeholder="Type slug"
            />

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
          </div>
        </TabsContent>

        <TabsContent value="relations" className="mt-0 pt-6">
          {relationSections.length ? (
            <Tabs
              value={activeRelationTab}
              onValueChange={(value) => {
                setActiveRelationTab(value);
              }}
              className="space-y-4"
            >
              <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
                {relationSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
                  >
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {relationSections.map((section) => (
                <TabsContent
                  key={section.id}
                  value={section.id}
                  className="mt-0"
                >
                  <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
                    {section.render({
                      data: props.data,
                      isServer: props.isServer,
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-muted-foreground">
              No relations configured for this model.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ParentAdminForm>
  );
}
