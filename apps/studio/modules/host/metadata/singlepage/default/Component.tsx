import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import { createHostStudioState } from "../../../../../workspace/utils/host-studio/index";
export interface IHostMetadataDefaultProps
  extends Omit<IHostStudioProviderProps, "children"> {
  id?: string;
}
export function HostMetadataDefault({
  id,
  ...provider
}: IHostMetadataDefaultProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        model="metadata"
        id={
          id ??
          (provider.state ?? provider.initialState ?? createHostStudioState())
            .models.metadata[0]?.id ??
          ""
        }
      />
    </HostStudioProvider>
  );
}
