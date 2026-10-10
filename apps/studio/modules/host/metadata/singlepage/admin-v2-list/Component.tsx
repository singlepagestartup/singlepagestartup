import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
export interface IHostMetadataAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  embedded?: boolean;
}
export function HostMetadataAdminV2List({
  embedded,
  ...provider
}: IHostMetadataAdminV2ListProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList model="metadata" embedded={embedded} />
    </HostStudioProvider>
  );
}
