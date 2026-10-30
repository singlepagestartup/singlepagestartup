"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/host/models/metadata/sdk/client";
import { Component as MetadataPreview } from "../seo-preview";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/host/models/metadata/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
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

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="host"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="metadata"
      status={status}
    >
      <div className="flex flex-col gap-6">
        {" "}
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
        {props.metadataToFileStorageModuleFiles
          ? props.metadataToFileStorageModuleFiles({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.pagesToMetadata
          ? props.pagesToMetadata({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        <MetadataPreview control={form.control} metadataId={props.data?.id} />
      </div>
    </ParentAdminForm>
  );
}
