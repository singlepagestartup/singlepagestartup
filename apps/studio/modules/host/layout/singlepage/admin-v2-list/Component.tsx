import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
export interface IHostLayoutAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  embedded?: boolean;
}
export function HostLayoutAdminV2List({
  embedded,
  ...provider
}: IHostLayoutAdminV2ListProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList model="layout" embedded={embedded} />
    </HostStudioProvider>
  );
}
