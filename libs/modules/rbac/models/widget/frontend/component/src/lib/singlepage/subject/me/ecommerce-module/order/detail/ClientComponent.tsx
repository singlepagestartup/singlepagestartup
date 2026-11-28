"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
export function ClientComponent({
  language,
  ecommerceModuleOrderId,
}: {
  language: string;
  ecommerceModuleOrderId?: string;
}) {
  if (!ecommerceModuleOrderId)
    return (
      <p role="status">
        {language === "ru" ? "Заказ недоступен." : "Order unavailable."}
      </p>
    );
  return (
    <Subject
      isServer={false}
      variant="me-ecommerce-module-order-detail-customer-default"
      language={language}
      ecommerceModuleOrderId={ecommerceModuleOrderId}
      renderDiscussion={({ chatId, threadId }) => (
        <Subject
          isServer={false}
          variant="me-social-module-profile-chat-overview-default"
          language={language}
          socialModuleChatId={chatId}
          socialModuleThreadId={threadId}
          defaultThreadId={threadId}
          getThreadHref={(id) =>
            `/${language}/social/chats/${chatId}/threads/${id}`
          }
        />
      )}
    />
  );
}
