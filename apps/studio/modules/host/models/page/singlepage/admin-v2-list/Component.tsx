import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
export interface IHostPageAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  embedded?: boolean;
}
export function HostPageAdminV2List({
  embedded,
  ...provider
}: IHostPageAdminV2ListProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList model="page" embedded={embedded} />
    </HostStudioProvider>
  );
}
