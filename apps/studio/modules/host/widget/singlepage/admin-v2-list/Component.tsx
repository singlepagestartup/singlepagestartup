import type { IComponentProps, IHostWidgetAdminV2ListProps } from "./interface";
export type { IHostWidgetAdminV2ListProps } from "./interface";
import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";

export function HostWidgetAdminV2List({
  variant = "admin-v2-list",
  embedded,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList variant={variant} model="widget" embedded={embedded} />
    </HostStudioProvider>
  );
}
