"use client";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import {
  toRequestSubmission,
  type IRequestFields,
} from "@sps/crm/models/request/sdk/model";
import { Form, Button } from "@sps/shared-ui-shadcn";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const form = useForm<IRequestFields>({ defaultValues: { steps: {} } });
  const submissionId = useRef<string | null>(null);
  const submitting = useRef(false);
  const [failure, setFailure] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<
    "queued" | "sent" | "failed"
  >("queued");
  const request = api.crmModuleFromRequestCreate({});
  async function submit(values: IRequestFields) {
    if (submitting.current || submitted) return;
    submitting.current = true;
    setFailure("");
    try {
      submissionId.current ??= crypto.randomUUID();
      const result = await request.mutateAsync({
        id: props.data.id,
        crmModuleFormId: props.crmModuleForm.id,
        data: toRequestSubmission(values, submissionId.current),
      });
      setNotificationStatus(
        result?.submissionResult?.notificationStatus ?? "queued",
      );
      setSubmitted(true);
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Request could not be submitted.",
      );
    } finally {
      submitting.current = false;
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="grid w-full gap-5"
        noValidate
      >
        <CrmModuleForm
          isServer={false}
          variant="support-ai-chat"
          data={props.crmModuleForm}
          dataSource="props"
          language={props.language}
          form={form}
          pending={request.isPending}
          submitted={submitted}
        >
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
          {submitted ? (
            <p role="status">
              {props.language === "ru" ? "Заявка сохранена" : "Request saved"}
              {notificationStatus !== "sent"
                ? props.language === "ru"
                  ? ". Доставка уведомления пока не подтверждена."
                  : ". Notification delivery is not confirmed yet."
                : ""}
            </p>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={request.isPending}
            >
              {props.language === "ru" ? "Отправить" : "Submit"}
            </Button>
          )}
        </CrmModuleForm>
      </form>
    </Form>
  );
}
