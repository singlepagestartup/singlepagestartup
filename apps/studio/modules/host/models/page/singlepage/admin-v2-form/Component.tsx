import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../../../../../../workspace/utils/host-studio/index";
export interface IHostPageAdminV2FormProps
  extends Omit<IHostStudioProviderProps, "children"> {
  record?: IModel;
  onSave?: (record: IModel) => void;
  embedded?: boolean;
}
export function HostPageAdminV2Form({
  record,
  onSave,
  embedded,
  ...provider
}: IHostPageAdminV2FormProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelForm
        model="page"
        record={record ?? createHostStudioState().models.page[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
