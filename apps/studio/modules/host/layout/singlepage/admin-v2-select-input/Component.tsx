import type {
  IComponentProps,
  IHostLayoutAdminV2SelectInputProps,
} from "./interface";
export type { IHostLayoutAdminV2SelectInputProps } from "./interface";
import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";

export function HostLayoutAdminV2SelectInput({
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
        model="layout"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
