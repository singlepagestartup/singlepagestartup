import type { IComponentProps, IHostLayoutAdminV2ListProps } from "./interface";
export type { IHostLayoutAdminV2ListProps } from "./interface";
import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";

export function HostLayoutAdminV2List({
  variant = "admin-v2-list",
  embedded,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList variant={variant} model="layout" embedded={embedded} />
    </HostStudioProvider>
  );
}
