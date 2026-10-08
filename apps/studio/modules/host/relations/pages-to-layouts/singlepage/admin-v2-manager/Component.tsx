import {
  HostRelationManager,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../../models/page/singlepage/composition/HostRecords/index";
export interface IHostPagesToLayoutsAdminV2ManagerProps
  extends Omit<IHostStudioProviderProps, "children"> {
  ownerId?: string;
  embedded?: boolean;
}
export function HostPagesToLayoutsAdminV2Manager({
  ownerId,
  embedded,
  ...provider
}: IHostPagesToLayoutsAdminV2ManagerProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRelationManager
        relation="pages-to-layouts"
        ownerId={ownerId}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
