import type { IComponentProps, IHostWidgetAdminV2FormProps } from "./interface";
export type { IHostWidgetAdminV2FormProps } from "./interface";
import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../../../page/singlepage/composition/HostRecords/state/index";

export function HostWidgetAdminV2Form({
  variant = "admin-v2-form",
  record,
  onSave,
  embedded,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelForm
        variant={variant}
        model="widget"
        record={record ?? createHostStudioState().models.widget[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
