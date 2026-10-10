import {
  HostModelSelect,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "../../../page/singlepage/composition/HostRecords/index";
export interface IHostLayoutAdminV2SelectInputProps
  extends Omit<IHostStudioProviderProps, "children"> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}
export function HostLayoutAdminV2SelectInput({
  value,
  onValueChange,
  disabled,
  ...provider
}: IHostLayoutAdminV2SelectInputProps = {}) {
  return (
    <HostStudioProvider {...provider}>
      <HostModelSelect
        model="layout"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </HostStudioProvider>
  );
}
