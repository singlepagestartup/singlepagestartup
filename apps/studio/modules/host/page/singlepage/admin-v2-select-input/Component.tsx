import type {
  IComponentProps,
  IHostPageAdminV2SelectInputProps,
} from "./interface";
export type { IHostPageAdminV2SelectInputProps } from "./interface";
import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";

export function HostPageAdminV2SelectInput({
  variant = "admin-v2-select-input",
  value,
  onValueChange,
  disabled,
  ...provider
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelSelect
        variant={variant}
        model="page"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
