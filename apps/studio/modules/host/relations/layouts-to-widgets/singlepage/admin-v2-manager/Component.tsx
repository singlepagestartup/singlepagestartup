import {
  HostRelationManager,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../../models/page/singlepage/composition/HostRecords/index";
export interface IHostLayoutsToWidgetsAdminV2ManagerProps
  extends Omit<IHostStudioProviderProps, "children"> {
  ownerId?: string;
  embedded?: boolean;
}
export function HostLayoutsToWidgetsAdminV2Manager({
  ownerId,
  embedded,
  ...provider
}: IHostLayoutsToWidgetsAdminV2ManagerProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRelationManager
        relation="layouts-to-widgets"
        ownerId={ownerId}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
