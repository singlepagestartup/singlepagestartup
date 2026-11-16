"use client";

import type { ComponentProps } from "react";
import { FormField } from "@sps/ui-adapter";

interface IOrderCommentProps {
  language: string;
  form: ComponentProps<typeof FormField>["form"];
}

export function OrderComment({ language, form }: IOrderCommentProps) {
  return (
    <FormField
      ui="shadcn"
      type="textarea"
      name="comment"
      form={form}
      label={language === "ru" ? "Комментарий к заказу" : "Order comment"}
      placeholder={language === "ru" ? "Необязательно" : "Optional"}
      rows={2}
      inputClassName="resize-y"
    />
  );
}
