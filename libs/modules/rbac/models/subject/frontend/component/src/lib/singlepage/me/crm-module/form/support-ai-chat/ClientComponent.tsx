"use client";
import { internationalization } from "@sps/shared-configuration";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import {
  toRequestSubmission,
  type IRequestFields,
} from "@sps/crm/models/request/sdk/model";
import { Form } from "@sps/shared-ui-shadcn";
import { Icon } from "@sps/ui-adapter";
import { AI_CHAT_SUPPORT_CONTENT as copy } from "@sps/shared-utils";
import type { IComponentPropsExtended, ISupportFormProps } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <CrmModuleForm
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [{ column: "id", method: "eq", value: props.crmModuleFormId }],
          },
        },
      }}
    >
      {({ data: crmModuleForms }) =>
        crmModuleForms?.length === 1 ? (
          <SupportForm
            key={`${props.data.id}:${crmModuleForms[0].id}`}
            isServer={false}
            variant={props.variant}
            data={props.data}
            className={props.className}
            crmModuleFormId={props.crmModuleFormId}
            language={props.language}
            crmModuleForm={crmModuleForms[0]}
          />
        ) : (
          <p role="alert">
            {(props.language || internationalization.defaultLanguage.code) ===
            "ru"
              ? "Форма обращения недоступна."
              : "Support form is unavailable."}
          </p>
        )
      }
    </CrmModuleForm>
  );
}
function SupportForm(props: ISupportFormProps) {
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
        crmModuleFormId: props.crmModuleFormId,
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
          : "Request could not be submitted. Please try again.",
      );
    } finally {
      submitting.current = false;
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        noValidate
        data-module="rbac"
        data-model="subject"
        data-variant={props.variant}
      >
        <CrmModuleForm
          isServer={false}
          variant="support-ai-chat"
          data={props.crmModuleForm}
          dataSource="props"
          language={props.language ?? "en"}
          form={form}
          pending={request.isPending}
          submitted={submitted}
        >
          {submitted ? (
            <div className="grid gap-5">
              <div role="status" className="grid gap-3">
                <p className="rounded-xl border border-border bg-muted p-4 text-sm">
                  {copy.labels["success-message"]}
                </p>
                {notificationStatus !== "sent" && (
                  <p className="text-sm text-muted-foreground">
                    {props.language === "ru"
                      ? "Заявка сохранена. Доставка уведомления пока не подтверждена."
                      : "Your request is saved. Notification delivery is not confirmed yet."}
                  </p>
                )}
              </div>
              {copy.successParagraphs.map((text) => (
                <p
                  key={text}
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {text}
                </p>
              ))}
              <button
                type="button"
                onClick={() => {
                  submissionId.current = null;
                  setSubmitted(false);
                }}
                className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted"
              >
                {copy.labels["edit-request"]}
              </button>
            </div>
          ) : (
            <>
              {failure && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                  {failure}
                </p>
              )}
              <button
                type="submit"
                disabled={request.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
              >
                <Icon name="paper-plane-tilt" />
                {request.isPending ? "Sending…" : copy.labels.submit}
              </button>
            </>
          )}
        </CrmModuleForm>
      </form>
    </Form>
  );
}
