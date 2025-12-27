"use client";

import { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CrmModuleFormsToSteps } from "@sps/crm/relations/forms-to-steps/frontend/component";
import { Component as CrmModuleStep } from "@sps/crm/models/step/frontend/component";
import { toast } from "sonner";

const formSchema = z.any();

export function Component(props: IComponentPropsExtended) {
  const crmModuleFromRequestCreate = api.crmModuleFromRequestCreate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      steps: [],
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    crmModuleFromRequestCreate.mutate({
      id: props.data.id,
      crmModuleFormId: props.crmModuleForm.id,
      data: {
        ...data,
      },
    });
  }

  useEffect(() => {
    if (crmModuleFromRequestCreate.isSuccess) {
      toast.success("Form submitted successfully");
    }
  }, [crmModuleFromRequestCreate]);

  return (
    <div
      data-module="crm"
      data-model="form"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <Form {...form}>
        <div className="w-full grid gap-4">
          <CrmModuleFormsToSteps
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "formId",
                      method: "eq",
                      value: props.crmModuleForm.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <CrmModuleStep
                    key={index}
                    isServer={false}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "eq",
                              value: entity.stepId,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data }) => {
                      return data?.map((entity, index) => {
                        return (
                          <CrmModuleStep
                            key={index}
                            isServer={false}
                            variant={entity.variant as any}
                            data={entity}
                            form={form}
                            disabled={crmModuleFromRequestCreate.isPending}
                            language={props.language}
                            path={`steps.[${index}].`}
                          />
                        );
                      });
                    }}
                  </CrmModuleStep>
                );
              });
            }}
          </CrmModuleFormsToSteps>

          <Button
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={crmModuleFromRequestCreate.isPending}
          >
            {props.language === "ru" ? "Отправить" : "Submit"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
