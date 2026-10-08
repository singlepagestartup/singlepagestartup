import {
  HostRelationManager,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../../models/page/singlepage/composition/HostRecords/index";
export interface IHostPagesToWidgetsAdminV2ManagerProps
  extends Omit<IHostStudioProviderProps, "children"> {
  ownerId?: string;
  embedded?: boolean;
}
export function HostPagesToWidgetsAdminV2Manager({
  ownerId,
  embedded,
  ...provider
}: IHostPagesToWidgetsAdminV2ManagerProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRelationManager
        relation="pages-to-widgets"
        ownerId={ownerId}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
