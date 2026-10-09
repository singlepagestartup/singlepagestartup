import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
export interface IHostMetadataAdminV2SelectInputProps
  extends Omit<IHostStudioProviderProps, "children"> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}
export function HostMetadataAdminV2SelectInput({
  value,
  onValueChange,
  disabled,
  ...provider
}: IHostMetadataAdminV2SelectInputProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelSelect
        model="metadata"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
