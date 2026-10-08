import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
import { createHostStudioState } from "../../../../../../workspace/utils/host-studio/index";
export interface IHostPageDefaultProps
  extends Omit<IHostStudioProviderProps, "children"> {
  id?: string;
}
export function HostPageDefault({
  id,
  ...provider
}: IHostPageDefaultProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        model="page"
        id={
          id ??
          (provider.state ?? provider.initialState ?? createHostStudioState())
            .models.page[0]?.id ??
          ""
        }
      />
    </HostStudioProvider>
  );
}
