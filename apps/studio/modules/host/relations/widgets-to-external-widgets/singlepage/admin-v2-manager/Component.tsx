import {
  HostRelationManager,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../../models/page/singlepage/composition/HostRecords/index";
export interface IHostWidgetsToExternalWidgetsAdminV2ManagerProps
  extends Omit<IHostStudioProviderProps, "children"> {
  ownerId?: string;
  embedded?: boolean;
}
export function HostWidgetsToExternalWidgetsAdminV2Manager({
  ownerId,
  embedded,
  ...provider
}: IHostWidgetsToExternalWidgetsAdminV2ManagerProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRelationManager
        relation="widgets-to-external-widgets"
        ownerId={ownerId}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
