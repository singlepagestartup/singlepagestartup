import type { IComponentProps, IHostMetadataDefaultProps } from "./interface";
export type { IHostMetadataDefaultProps } from "./interface";
import {
  HostRecordPreview,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import { createHostStudioState } from "../../../page/singlepage/composition/HostRecords/state/index";

export function HostMetadataDefault({
  variant = "default",
  id,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostRecordPreview
        variant={variant}
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
