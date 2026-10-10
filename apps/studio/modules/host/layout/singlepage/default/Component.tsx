import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import { createHostStudioState } from "../../../../../workspace/utils/host-studio/index";
export interface IHostLayoutDefaultProps
  extends Omit<IHostStudioProviderProps, "children"> {
  id?: string;
}
export function HostLayoutDefault({
  id,
  ...provider
}: IHostLayoutDefaultProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        model="layout"
        id={
          id ??
          (provider.state ?? provider.initialState ?? createHostStudioState())
            .models.layout[0]?.id ??
          ""
        }
      />
    </HostStudioProvider>
  );
}
