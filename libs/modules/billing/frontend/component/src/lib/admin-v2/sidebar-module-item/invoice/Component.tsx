import { Component as Invoice } from "@sps/billing/models/invoice/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/billing/invoice`);

  return (
    <Invoice
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
