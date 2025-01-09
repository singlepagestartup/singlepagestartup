"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { FormField } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const formSchema = z.object({
  password: z.string().min(8),
  passwordConfirmation: z.string().min(8),
  code: z.string(),
});

export function Component(props: IComponentPropsExtended) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const resetPassword = api.authenticationLoginAndPasswordResetPassword({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
      code: "",
    },
  });

  useEffect(() => {
    if (code) {
      form.setValue("code", code);
    }
  }, [code, form]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    resetPassword.mutate({
      data,
    });
  }

  useEffect(() => {
    if (resetPassword.isSuccess) {
      toast.success("Password reset successfully");
    }
  }, [resetPassword]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col", props.className)}
    >
      <Form {...form}>
        <div className="w-full flex flex-col gap-6">
          <FormField
            ui="shadcn"
            type="text"
            label="Password"
            name="password"
            form={form}
            placeholder="Enter new password"
          />
          <FormField
            ui="shadcn"
            type="text"
            label="Password Confirmation"
            name="passwordConfirmation"
            form={form}
            placeholder="Re-enter new password"
          />

          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Reset password
          </Button>
        </div>
      </Form>
    </div>
  );
}
