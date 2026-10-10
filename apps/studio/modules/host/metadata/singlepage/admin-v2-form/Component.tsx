import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../../../../../workspace/utils/host-studio/index";
export interface IHostMetadataAdminV2FormProps
  extends Omit<IHostStudioProviderProps, "children"> {
  record?: IModel;
  onSave?: (record: IModel) => void;
  embedded?: boolean;
}
export function HostMetadataAdminV2Form({
  record,
  onSave,
  embedded,
  ...provider
}: IHostMetadataAdminV2FormProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelForm
        model="metadata"
        record={record ?? createHostStudioState().models.metadata[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
