"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/rbac/models/subject/sdk/model";
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
      module="website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="subject"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Slug"
          name="slug"
          form={form}
          placeholder="Enter slug"
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
        {props.subjectsToIdentities
          ? props.subjectsToIdentities({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        {props.subjectsToRoles
          ? props.subjectsToRoles({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        {props.subjectsToEcommerceModuleProducts
          ? props.subjectsToEcommerceModuleProducts({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.subjectsToEcommerceModuleOrders
          ? props.subjectsToEcommerceModuleOrders({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        {props.subjectsToNotificationModuleTopics
          ? props.subjectsToNotificationModuleTopics({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        {props.subjectsToBillingModulePaymentIntents
          ? props.subjectsToBillingModulePaymentIntents({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
        {props.subjectsToSocialModuleProfiles
          ? props.subjectsToSocialModuleProfiles({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
        {props.subjectsToBlogModuleArticles
          ? props.subjectsToBlogModuleArticles({
              data: props.data,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
