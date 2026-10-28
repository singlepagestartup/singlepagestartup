"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/host/models/metadata/sdk/client";
import { Component as MetadataPreview } from "../../admin/seo-preview";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/host/models/metadata/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
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
      title: props.data?.title || "",
      description: props.data?.description || "",
      keywords: props.data?.keywords || "",
      author: props.data?.author || "",
      opengraphImage: props.data?.opengraphImage || "",
      twitterImage: props.data?.twitterImage || "",
      opengraphTitle: props.data?.opengraphTitle || "",
      opengraphDescription: props.data?.opengraphDescription || "",
      opengraphUrl: props.data?.opengraphUrl || "",
      opengraphType: props.data?.opengraphType || "",
      opengraphSiteName: props.data?.opengraphSiteName || "",
      opengraphLocale: props.data?.opengraphLocale || "",
      twitterCard: props.data?.twitterCard || "",
      twitterSite: props.data?.twitterSite || "",
      twitterCreator: props.data?.twitterCreator || "",
      twitterTitle: props.data?.twitterTitle || "",
      twitterDescription: props.data?.twitterDescription || "",
      twitterUrl: props.data?.twitterUrl || "",
      twitterDomain: props.data?.twitterDomain || "",
      twitterAppCountry: props.data?.twitterAppCountry || "",

      variant: props.data?.variant || "default",
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
        id: "metadata-to-files",
        title: "Cover images",
        render: props.metadataToFileStorageModuleFiles,
      },
      {
        id: "pages-to-metadata",
        title: "Pages",
        render: props.pagesToMetadata,
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
  }, [props.pagesToMetadata, props.metadataToFileStorageModuleFiles]);

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
      module="host"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="metadata"
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
            <p className="text-sm text-muted-foreground">
              Text accepts masks such as [blog.articles.title] and
              [blog.articles.metadata.seo.keywords]. Images accept a URL or a
              file relation mask; the linked cover is used when empty. Viewport
              is managed by Host.
            </p>
            <MetadataPreview
              control={form.control}
              metadataId={props.data?.id}
            />
            {[
              "title",
              "description",
              "keywords",
              "author",
              "opengraphImage",
              "twitterImage",
              "opengraphTitle",
              "opengraphDescription",
              "opengraphUrl",
              "opengraphType",
              "opengraphSiteName",
              "opengraphLocale",
              "twitterCard",
              "twitterSite",
              "twitterCreator",
              "twitterTitle",
              "twitterDescription",
              "twitterUrl",
              "twitterDomain",
              "twitterAppCountry",
            ].map((name) => (
              <FormField
                key={name}
                ui="shadcn"
                type="text"
                name={name}
                label={name}
                form={form}
                placeholder={name}
              />
            ))}
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
