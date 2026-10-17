import type { IComponentProps, IHostPageAdminV2ListProps } from "./interface";
export type { IHostPageAdminV2ListProps } from "./interface";
import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";

export function HostPageAdminV2List({
  variant = "admin-v2-list",
  embedded,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList variant={variant} model="page" embedded={embedded} />
    </HostStudioProvider>
  );
}
