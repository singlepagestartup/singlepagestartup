"use client";

import { FormField } from "@sps/ui-adapter";
import type { IOrderCommentProps } from "./interface";

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
