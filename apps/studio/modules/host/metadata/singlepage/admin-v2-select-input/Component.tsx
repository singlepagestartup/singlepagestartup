import type {
  IComponentProps,
  IHostMetadataAdminV2SelectInputProps,
} from "./interface";
export type { IHostMetadataAdminV2SelectInputProps } from "./interface";
import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";

export function HostMetadataAdminV2SelectInput({
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
        model="metadata"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
