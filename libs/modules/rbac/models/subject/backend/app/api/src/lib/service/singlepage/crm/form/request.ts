import { createHash } from "node:crypto";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  requestSubmissionSchema as crmRequestSubmissionSchema,
  type IRequestSubmission as ICrmRequestSubmission,
  type IRequestInput as ICrmRequestInput,
} from "@sps/crm/models/request/sdk/model";
import type { Service as SubjectService } from "../../index";
import type { TNotificationStatus } from "@sps/crm/models/request/backend/app/api/src/lib/service";

export interface IExecuteProps {
  subjectId: string;
  crmModuleFormId: string;
  data: ICrmRequestSubmission;
}
export class Service {
  constructor(readonly service: SubjectService) {}
  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    const entity = await this.service.findById({ id: props.subjectId });
    if (!entity) throw new Error("Not Found error. Subject not found");
    const parsed = crmRequestSubmissionSchema.safeParse(props.data);
    if (!parsed.success)
      throw new Error("Validation error. Invalid CRM submission values");
    const submission = parsed.data;
    const key = createHash("sha256")
      .update(
        `${props.subjectId}:${props.crmModuleFormId}:${submission.submissionId}`,
      )
      .digest("hex");
    const digest = createHash("sha256")
      .update(JSON.stringify(submission))
      .digest("hex");
    const previous = await this.service.crmModule.request.findSubmission({
      key,
      digest,
    });
    if (previous) return this.result(entity, previous, true);
    const form = await this.service.crmModule.form.findById({
      id: props.crmModuleFormId,
    });
    if (!form) throw new Error("Not Found error. CRM Form not found");
    const normalized = await this.normalize(form, submission);
    const recipients = await this.notificationRecipients();
    const saved = await this.service.crmModule.request.submit({
      key,
      digest,
      formId: form.id,
      payload: {
        subjectId: entity.id,
        formId: form.id,
        submissionId: submission.submissionId,
        form: normalized,
      },
    });
    if (!saved.created) return this.result(entity, saved.request, true);
    let status: TNotificationStatus = "sent";
    for (const { subjectId, template } of recipients) {
      try {
        const delivered = await subjectApi.notify({
          id: subjectId,
          data: {
            notification: {
              topic: { slug: "information" },
              template,
              notification: {
                title: template.title,
                data: { crm: { form: normalized }, rbac: { subject: entity } },
              },
            },
          },
          options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
        });
        const notifications = delivered?.notificationService.notifications;
        if (
          !Array.isArray(notifications) ||
          !notifications.length ||
          notifications.some((notification) =>
            ["error", "failed"].includes(notification.status),
          )
        ) {
          status = "failed";
        } else if (
          status !== "failed" &&
          notifications.some((notification) => notification.status !== "sent")
        ) {
          status = "queued";
        }
      } catch {
        status = "failed";
      }
    }
    try {
      const request =
        await this.service.crmModule.request.setSubmissionNotificationStatus({
          id: saved.request.id,
          key,
          status,
        });
      return this.result(entity, request, false);
    } catch {
      // The submission is committed. A status-write failure must not invite a duplicate submission or notification.
      return this.result(entity, saved.request, false);
    }
  }
  private result(entity: any, request: any, replayed: boolean) {
    const status = request.payload?.notificationStatus;
    return {
      ...entity,
      submissionResult: {
        saved: true as const,
        requestId: request.id,
        formId: request.payload?.formId,
        notificationStatus:
          status === "sent" || status === "failed" ? status : "queued",
        replayed,
      },
    };
  }
  private async notificationRecipients() {
    const topics = await this.service.notificationModule.topic.find({
      params: {
        filters: {
          and: [{ column: "slug", method: "eq", value: "information" }],
        },
      },
    });
    if (!topics?.length)
      throw new Error("Configuration error. CRM notification topic not found");
    const templates = await this.service.notificationModule.template.find({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "ilike",
              value: "crm-form-request-created-admin",
            },
          ],
        },
      },
    });
    if (!templates?.length)
      throw new Error(
        "Configuration error. CRM notification templates not found",
      );
    const roles = await this.service.role.find({
      params: {
        filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
      },
    });
    const links = roles.length
      ? await this.service.subjectsToRoles.find({
          params: {
            filters: {
              and: [
                {
                  column: "roleId",
                  method: "inArray",
                  value: roles.map((role) => role.id),
                },
              ],
            },
          },
        })
      : [];
    const subjects = [...new Set(links.map((link) => link.subjectId))];
    if (!subjects.length)
      throw new Error(
        "Configuration error. CRM notification recipients not found",
      );
    return templates.flatMap((template) =>
      subjects.map((subjectId) => ({ subjectId, template })),
    );
  }
  private async normalize(form: any, submission: ICrmRequestSubmission) {
    const crm = this.service.crmModule;
    const filter = (
      column: string,
      value: string | string[],
      method = "eq",
    ) => ({ params: { filters: { and: [{ column, method, value }] } } });
    const stepLinks = await crm.formsToSteps.find(filter("formId", form.id));
    if (!stepLinks.length)
      throw new Error("Configuration error. CRM Form has no Steps");
    const stepIds = [
      ...new Set<string>(stepLinks.map((link: any) => link.stepId)),
    ];
    const steps = await crm.step.find(filter("id", stepIds, "inArray"));
    const inputsLinks = await crm.stepsToInputs.find(
      filter("stepId", stepIds, "inArray"),
    );
    const inputIds = [
      ...new Set<string>(inputsLinks.map((link: any) => link.inputId)),
    ];
    const inputs = inputIds.length
      ? await crm.input.find(filter("id", inputIds, "inArray"))
      : [];
    const posted = new Map<string, Map<string, ICrmRequestInput>>();
    for (const step of submission.steps) {
      if (!stepIds.includes(step.id) || posted.has(step.id))
        throw new Error(
          "Validation error. CRM Step does not belong to this Form or is duplicated",
        );
      const values = new Map<string, ICrmRequestInput>();
      for (const input of step.inputs) {
        if (
          values.has(input.id) ||
          !inputsLinks.some(
            (link: any) => link.stepId === step.id && link.inputId === input.id,
          )
        )
          throw new Error(
            "Validation error. CRM Input does not belong to this Step or is duplicated",
          );
        values.set(input.id, input);
      }
      posted.set(step.id, values);
    }
    const result: any[] = [];
    for (const link of stepLinks) {
      const step = steps.find((row: any) => row.id === link.stepId);
      if (!step) throw new Error("Configuration error. CRM Step not found");
      const fields: any[] = [];
      for (const inputLink of inputsLinks.filter(
        (row: any) => row.stepId === step.id,
      )) {
        const input = inputs.find((row: any) => row.id === inputLink.inputId);
        if (!input) throw new Error("Configuration error. CRM Input not found");
        const value = posted.get(step.id)?.get(input.id);
        const kind =
          input.variant?.startsWith("select") || input.type === "select"
            ? "option"
            : input.variant?.startsWith("number") || input.type === "number"
              ? "number"
              : input.variant?.startsWith("checkbox") ||
                  input.type === "boolean" ||
                  input.type === "checkbox"
                ? "boolean"
                : "string";
        const suppliedKeys = value
          ? ["string", "number", "boolean", "option"].filter(
              (key) => value[key as keyof ICrmRequestInput] !== undefined,
            )
          : [];
        if (suppliedKeys.some((key) => key !== kind))
          throw new Error(
            "Validation error. CRM Input value has an invalid type",
          );
        const provided = value?.[kind as keyof ICrmRequestInput];
        if (
          input.isRequired &&
          (provided === undefined ||
            provided === "" ||
            (typeof provided === "string" && !provided.trim()))
        )
          throw new Error("Validation error. A required CRM Input is missing");
        let option: any;
        if (kind === "option" && value?.option !== undefined) {
          const optionId =
            typeof value.option === "string" ? value.option : value.option.id;
          const links = await crm.inputsToOptions.find(
            filter("inputId", input.id),
          );
          if (!links.some((row: any) => row.optionId === optionId))
            throw new Error(
              "Validation error. CRM Option does not belong to this Input",
            );
          option = await crm.option.findById({ id: optionId });
          if (!option)
            throw new Error("Configuration error. CRM Option not found");
        }
        fields.push({
          ...input,
          ...(kind === "option"
            ? option
              ? { option }
              : {}
            : provided !== undefined
              ? { [kind]: provided }
              : {}),
        });
      }
      result.push({ ...step, inputs: fields });
    }
    return { ...form, steps: result };
  }
}
