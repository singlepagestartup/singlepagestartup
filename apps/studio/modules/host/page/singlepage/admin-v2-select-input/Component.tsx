import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../composition/HostRecords/index";
export interface IHostPageAdminV2SelectInputProps
  extends Omit<IHostStudioProviderProps, "children"> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}
export function HostPageAdminV2SelectInput({
  value,
  onValueChange,
  disabled,
  ...provider
}: IHostPageAdminV2SelectInputProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelSelect
        model="page"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
