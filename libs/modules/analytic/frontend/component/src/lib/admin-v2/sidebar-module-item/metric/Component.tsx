import { Component as Metric } from "@sps/analytic/models/metric/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/analytic/metric`);

  return (
    <Metric
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
