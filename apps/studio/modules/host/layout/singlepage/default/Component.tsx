import type { IComponentProps, IHostLayoutDefaultProps } from "./interface";
export type { IHostLayoutDefaultProps } from "./interface";
import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import { createHostStudioState } from "../../../page/singlepage/composition/HostRecords/state/index";

export function HostLayoutDefault({
  variant = "default",
  id,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        variant={variant}
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
