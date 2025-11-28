"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { FormField } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { userStories } from "@sps/shared-configuration";

const formSchema = z.object({
  login: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  password: z.string().min(8),
});

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const emailAndPassword = api.authenticationEmailAndPasswordAuthentication({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    emailAndPassword.mutate({
      data,
    });
  }

  useEffect(() => {
    if (emailAndPassword.isSuccess) {
      router.push(userStories.subjectAuthentication.redirect.success);
    }
  }, [emailAndPassword]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <Form {...form}>
        <div className="w-full grid gap-4">
          <FormField
            ui="shadcn"
            type="text"
            label="Email"
            name="login"
            form={form}
            placeholder="Enter your email"
          />
          <FormField
            ui="shadcn"
            type="password"
            label="Password"
            name="password"
            form={form}
            placeholder="Enter your password"
          >
            <Link
              href="/rbac/subject/authentication/email-and-password/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
              prefetch={true}
            >
              Forgot your password?
            </Link>
          </FormField>

          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Login
          </Button>
        </div>
      </Form>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/rbac/subject/authentication/email-and-password/registration"
          className="underline underline-offset-4"
          prefetch={true}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
