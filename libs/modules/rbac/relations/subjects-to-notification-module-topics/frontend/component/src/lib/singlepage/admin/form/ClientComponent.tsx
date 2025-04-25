"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/model";
import { api } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as NotificationModuleTopic } from "@sps/notification/models/topic/frontend/component";
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
      orderIndex: props.data?.orderIndex || 0,
      className: props.data?.className || "",
      subjectId: props.data?.subjectId || "",
      notificationModuleTopicId: props.data?.notificationModuleTopicId || "",
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
      module="rbac"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="subjects-to-notification-module-topics"
      type="relation"
      status={status}
    >
      <div className="flex flex-col gap-6">
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

        <Subject
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="subjectId"
          form={form}
        />

        <NotificationModuleTopic
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="notificationModuleTopicId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
