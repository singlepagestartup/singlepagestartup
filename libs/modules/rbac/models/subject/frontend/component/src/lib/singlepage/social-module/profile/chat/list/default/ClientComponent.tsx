"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { toast } from "sonner";

const formSchema = z.any();

export function Component(props: IComponentPropsExtended) {
  console.log("🚀 ~ Component ~ props:", props.data);
  // const socialModuleProfileFindByIdChatFind =
  //   api.socialModuleProfileFindByIdChatFind({
  //     id: props.data.id,
  //     socialModuleProfileId: props.socialModuleProfile.id,
  //     options: {
  //       headers: {
  //         "Cache-Control": "no-store",
  //       },
  //     },
  //   });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // crmModuleFromRequestCreate.mutate({
    //   id: props.data.id,
    //   data: {
    //     ...data,
    //     formId: props.crmModuleForm.id,
    //   },
    // });
  }

  // useEffect(() => {
  //   if (crmModuleFromRequestCreate.isSuccess) {
  //     toast.success("Form submitted successfully");
  //   }
  // }, [crmModuleFromRequestCreate]);

  return (
    <div
      data-module="crm"
      data-model="form"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      {/* <Form {...form}>
        <div className="w-full grid gap-4">
          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Submit
          </Button>
        </div>
      </Form> */}
    </div>
  );
}
