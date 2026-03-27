"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/models/attribute-key/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  types,
  fields,
} from "@sps/social/models/attribute-key/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin-v2/agregated-input/Component";
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
      prefix: props.data?.prefix || {},
      suffix: props.data?.suffix || {},
      type: props.data?.type || "",
      title: props.data?.title || {},
      field: props.data?.field || "string",
      adminTitle:
        props.data?.adminTitle || randomWordsGenerator({ type: "title" }),
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

  const relationSections = useMemo(() => {
    return [
      {
        id: "attribute-keys-to-attributes",
        title: "Attributes",
        render: props.attributeKeysToAttributes,
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
  }, [props.attributeKeysToAttributes]);

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
      isServer={false}
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="attribute-key"
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
              name="slug"
              label="Slug"
              form={form}
              placeholder="Type slug"
            />

            <AgregatedInput title="Prefix">
              {internationalization.languages.map((language) => {
                return (
                  <FormField
                    key={language.code}
                    ui="shadcn"
                    type="text"
                    name={`prefix.${language.code}`}
                    label={language.title}
                    form={form}
                    placeholder="Type prefix"
                  />
                );
              })}
            </AgregatedInput>

            <AgregatedInput title="Suffiz">
              {internationalization.languages.map((language) => {
                return (
                  <FormField
                    key={language.code}
                    ui="shadcn"
                    type="text"
                    name={`suffix.${language.code}`}
                    label={language.title}
                    form={form}
                    placeholder="Type suffix"
                  />
                );
              })}
            </AgregatedInput>

            <FormField
              ui="shadcn"
              type="select"
              name="type"
              label="Type"
              form={form}
              placeholder="Select type"
              options={types.map((type) => [type, type])}
            />

            <FormField
              ui="shadcn"
              type="select"
              name="field"
              label="Field"
              form={form}
              placeholder="Select field"
              options={fields.map((field) => [field, field])}
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
                      isServer: false,
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
