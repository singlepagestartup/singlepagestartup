import type { IComponentProps, IHostPageDefaultProps } from "./interface";
export type { IHostPageDefaultProps } from "./interface";
import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
import { createHostStudioState } from "../composition/HostRecords/state/index";

export function HostPageDefault({
  variant = "default",
  id,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        variant={variant}
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
