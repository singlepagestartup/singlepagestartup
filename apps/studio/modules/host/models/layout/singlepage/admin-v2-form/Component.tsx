import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../../../../../../workspace/utils/host-studio/index";
export interface IHostLayoutAdminV2FormProps
  extends Omit<IHostStudioProviderProps, "children"> {
  record?: IModel;
  onSave?: (record: IModel) => void;
  embedded?: boolean;
}
export function HostLayoutAdminV2Form({
  record,
  onSave,
  embedded,
  ...provider
}: IHostLayoutAdminV2FormProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelForm
        model="layout"
        record={record ?? createHostStudioState().models.layout[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
