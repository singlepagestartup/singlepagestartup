import {
  HostModelList,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
export interface IHostWidgetAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  embedded?: boolean;
}
export function HostWidgetAdminV2List({
  embedded,
  ...provider
}: IHostWidgetAdminV2ListProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelList model="widget" embedded={embedded} />
    </HostStudioProvider>
  );
}
