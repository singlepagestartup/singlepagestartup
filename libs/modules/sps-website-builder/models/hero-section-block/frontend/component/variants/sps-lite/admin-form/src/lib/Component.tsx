"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { useRouter } from "next/navigation";
import { api } from "@sps/sps-website-builder-models-hero-section-block-frontend-api-client";
import { useForm } from "react-hook-form";
import {
  Form,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sps/shadcn";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { invalidateServerTag } from "@sps/store";
import { Component as HeroSectionBlockSpsLiteAdminFormInputs } from "@sps/sps-website-builder-models-hero-section-block-frontend-component-variants-sps-lite-admin-form-inputs";

const formSchema = z.object({
  title: z.string(),
  variant: z.string().min(1),
});

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [updateEntity, updateEntityResult] = api.rtk.useUpdateMutation();
  const [createEntity, createEntityResult] = api.rtk.useCreateMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: props.data?.title || "",
      variant: props.data?.variant || "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (props.data?.id) {
      await updateEntity({ id: props.data?.id, data });
      return;
    }

    await createEntity({
      data,
    });
  }

  useEffect(() => {
    if (updateEntityResult.data || createEntityResult.data) {
      dispatch(api.rtk.util.invalidateTags(["hero-section-block"]));
      invalidateServerTag({ tag: "hero-section-block" });

      if (props.setOpen) {
        props.setOpen(false);
      }

      router.refresh();
    }
  }, [updateEntityResult, createEntityResult]);

  return (
    <div
      data-module="sps-website-builder"
      data-model="hero-section-block"
      data-variant={props.variant}
      className={props.className || ""}
    >
      <Form {...form}>
        <Card>
          <CardHeader>
            <CardTitle>
              {props.data?.id ? "Edit" : "Create"} hero-section-block
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <HeroSectionBlockSpsLiteAdminFormInputs
              isServer={false}
              variant="admin-form-inputs"
              form={form}
            />
            <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
              {props.data?.id ? "Update" : "Create"}
            </Button>
          </CardContent>
        </Card>
      </Form>
    </div>
  );
}