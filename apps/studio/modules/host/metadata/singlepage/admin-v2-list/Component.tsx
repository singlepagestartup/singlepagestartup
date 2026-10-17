import type {
  IComponentProps,
  IHostMetadataAdminV2ListProps,
} from "./interface";
export type { IHostMetadataAdminV2ListProps } from "./interface";
import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";

export function HostMetadataAdminV2List({
  variant = "admin-v2-list",
  embedded,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList variant={variant} model="metadata" embedded={embedded} />
    </HostStudioProvider>
  );
}
