"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FormsToInputs } from "@sps/crm/relations/forms-to-inputs/frontend/component";
import { toast } from "sonner";

const formSchema = z.any();

export function Component(props: IComponentPropsExtended) {
  const crmFromsCreate = api.crmFromsCreate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    crmFromsCreate.mutate({
      id: props.data.id,
      data: {
        ...data,
        formId: props.form.id,
      },
    });
  }

  useEffect(() => {
    if (crmFromsCreate.isSuccess) {
      toast.success("Form submitted successfully");
    }
  }, [crmFromsCreate]);

  return (
    <div
      data-module="crm"
      data-model="form"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <Form {...form}>
        <div className="w-full grid gap-4">
          <FormsToInputs
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "formId", method: "eq", value: props.form.id },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <FormsToInputs
                    key={index}
                    isServer={false}
                    variant={entity.variant as any}
                    data={entity}
                    form={form}
                    disabled={crmFromsCreate.isPending}
                    language={props.language}
                  />
                );
              });
            }}
          </FormsToInputs>

          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
}
