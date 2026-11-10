export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/notification/models/template/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";
import { z } from "zod";

// API → Host rendering input. `data` retains each component's existing contract;
// `template` contains saved copy with scalar placeholders already substituted.
export interface IRenderRequest {
  variant: string;
  data?: unknown;
  template: {
    title: string | null;
    content: string | null;
  };
  language?: string;
}

export const renderRequestSchema: z.ZodType<IRenderRequest> = z
  .object({
    variant: z.string().min(1).max(200),
    data: z.unknown().optional(),
    template: z.object({
      title: z.string().max(1000).nullable(),
      content: z.string().max(32000).nullable(),
    }),
    language: z.string().min(1).max(35).optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.variant === "content-email" ||
        value.variant === "content-telegram") &&
      !value.template.content?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["template", "content"],
        message: "Validation error. Template content is required",
      });
    }
  });

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/notification/templates";
export const variants = [
  "hidden",
  "default",
  "content-email",
  "content-telegram",
  "generate-email-ecommerce-order-status-changed-default",
  "generate-telegram-ecommerce-order-status-changed-default",
  "generate-telegram-ecommerce-order-status-changed-admin",
  "reset-password",
  "generate-email-agent-result-admin",
  "generate-email-crm-form-request-created-admin",
  "generate-telegram-crm-form-request-created-admin",
  "generate-telegram-social-module-message-created",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
