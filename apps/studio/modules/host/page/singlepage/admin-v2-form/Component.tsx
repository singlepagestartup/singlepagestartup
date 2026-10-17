import type { IComponentProps, IHostPageAdminV2FormProps } from "./interface";
export type { IHostPageAdminV2FormProps } from "./interface";
import {
  HostModelForm,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
import type { IModel } from "../../interface";
import { createHostStudioState } from "../composition/HostRecords/state/index";

export function HostPageAdminV2Form({
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
        model="page"
        record={record ?? createHostStudioState().models.page[0]}
        onSaved={(saved) => onSave?.(saved as IModel)}
        embedded={embedded}
      />
    </HostStudioProvider>
  );
}
