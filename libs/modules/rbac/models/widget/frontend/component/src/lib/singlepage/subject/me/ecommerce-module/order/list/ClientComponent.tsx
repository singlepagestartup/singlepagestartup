"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
export function ClientComponent({ language }: { language: string }) {
  return (
    <Subject
      isServer={false}
      variant="me-ecommerce-module-order-list-customer-default"
      language={language}
    />
  );
}
