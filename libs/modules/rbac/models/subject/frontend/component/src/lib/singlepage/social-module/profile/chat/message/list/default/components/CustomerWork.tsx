"use client";

import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { Discussion } from "../../../../../../../ecommerce-module/order/create-default/customer-work/Discussion";

interface IProps {
  subjectId: string;
  threadId: string;
  language: string;
}

export function CustomerWork({ subjectId, threadId, language }: IProps) {
  const ru = language === "ru";
  const result = api.customerWorkForThread({ id: subjectId, threadId });
  if (result.isError) {
    return (
      <p role="alert" className="p-4 text-sm">
        {ru ? "Обсуждение недоступно." : "This conversation is unavailable."}
      </p>
    );
  }
  const work = result.data;
  if (!work) {
    return (
      <p role="status" className="p-4 text-sm">
        {ru ? "Загружаем переписку…" : "Loading conversation…"}
      </p>
    );
  }
  return (
    <CustomerWorkView subjectId={subjectId} language={language} work={work} />
  );
}

export function CustomerWorkView({
  subjectId,
  language,
  work,
}: Omit<IProps, "threadId"> & { work: ICustomerWorkView }) {
  const router = useRouter();
  const ru = language === "ru";
  const productPath =
    work.productSlug &&
    `/${language}/ecommerce/products/${encodeURIComponent(work.productSlug)}`;
  function back() {
    if (productPath && work?.offerId && !work.orderId) {
      const query = new URLSearchParams({
        offer: work.offerId,
        consultation: work.taskId,
      });
      router.push(`${productPath}?${query}`);
      return;
    }
    router.push(productPath || `/${language}/social/chats`);
  }
  return (
    <Discussion
      subjectId={subjectId}
      work={work}
      language={language}
      onClose={back}
      closeLabel={
        productPath
          ? ru
            ? "К предложению"
            : "Back to offer"
          : ru
            ? "К обсуждениям"
            : "Back to conversations"
      }
    />
  );
}
