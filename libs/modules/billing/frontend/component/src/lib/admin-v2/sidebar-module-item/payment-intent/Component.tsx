import { Component as PaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(
    `${ADMIN_BASE_PATH}/billing/payment-intent`,
  );

  return (
    <PaymentIntent
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
