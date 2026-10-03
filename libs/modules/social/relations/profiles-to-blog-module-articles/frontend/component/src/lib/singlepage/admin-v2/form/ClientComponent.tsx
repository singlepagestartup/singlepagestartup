"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/client";
import { useForm } from "react-hook-form";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@sps/shared-ui-shadcn";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Article } from "@sps/blog/models/article/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();
  const deleteEntity = api.delete();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const relationId = props.data?.id;
  const onDelete = useCallback(() => {
    if (!relationId || deletingId) {
      return;
    }
    setDeletingId(relationId);
    deleteEntity.mutate(
      { id: relationId },
      { onSettled: () => setDeletingId(null) },
    );
  }, [relationId, deletingId, deleteEntity.mutate]);

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      profileId: props.data?.profileId ?? props.defaultProfileId ?? "",
      blogModuleArticleId:
        props.data?.blogModuleArticleId ??
        props.defaultBlogModuleArticleId ??
        "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (deletingId) {
      return;
    }
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
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="profiles-to-blog-module-articles"
      status={deletingId ? "pending" : status}
      type="relation"
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
          label="Class Name"
          name="className"
          form={form}
          placeholder="Type class name"
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
        <Profile
          isServer={false}
          variant="admin-v2-select-input"
          formFieldName="profileId"
          form={form}
        />
        <Article
          isServer={false}
          variant="admin-v2-select-input"
          formFieldName="blogModuleArticleId"
          form={form}
        />
        {relationId ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={Boolean(deletingId) || status === "pending"}
              >
                {deletingId ? "Deleting relation..." : "Delete relation"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete relation?</AlertDialogTitle>
                <AlertDialogDescription>
                  The profile and article will remain available.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        {deleteEntity.error ? (
          <p role="alert">Could not delete relation.</p>
        ) : null}
      </div>
    </ParentAdminForm>
  );
}
