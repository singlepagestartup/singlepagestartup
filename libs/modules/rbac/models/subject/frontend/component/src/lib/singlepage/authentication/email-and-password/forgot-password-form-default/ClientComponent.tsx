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

const formSchema = z.object({
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
});

export function Component(props: IComponentPropsExtended) {
  const forgotPassword = api.authenticationEmailAndPasswordForgotPassword({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    forgotPassword.mutate({
      data,
    });
  }

  useEffect(() => {
    if (forgotPassword.isSuccess) {
      toast.success("Reset link sent");
    }
  }, [forgotPassword]);

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
            label="Email"
            name="email"
            form={form}
            placeholder="Enter your email"
          />

          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Send reset link
          </Button>
        </div>
      </Form>
    </div>
  );
}
