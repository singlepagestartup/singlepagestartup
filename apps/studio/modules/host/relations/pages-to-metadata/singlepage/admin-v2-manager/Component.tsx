import {
  HostRelationManager,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../../models/page/singlepage/composition/HostRecords/index";
export interface IHostPagesToMetadataAdminV2ManagerProps
  extends Omit<IHostStudioProviderProps, "children"> {
  ownerId?: string;
  embedded?: boolean;
}
export function HostPagesToMetadataAdminV2Manager({
  ownerId,
  embedded,
  ...provider
}: IHostPagesToMetadataAdminV2ManagerProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRelationManager
        relation="pages-to-metadata"
        ownerId={ownerId}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
