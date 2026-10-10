import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../../../../../workspace/utils/host-studio/index";
export interface IHostWidgetAdminV2FormProps
  extends Omit<IHostStudioProviderProps, "children"> {
  record?: IModel;
  onSave?: (record: IModel) => void;
  embedded?: boolean;
}
export function HostWidgetAdminV2Form({
  record,
  onSave,
  embedded,
  ...provider
}: IHostWidgetAdminV2FormProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelForm
        model="widget"
        record={record ?? createHostStudioState().models.widget[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
