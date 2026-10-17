import type { IComponentProps, IHostPageCompositionProps } from "./interface";
export type { IHostPageCompositionProps } from "./interface";
import {
  HostWorkbench,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "./HostRecords/index";

export function HostPageComposition({
  variant = "composition",
  ...props
}: IComponentProps = {}) {
  return (
    <HostStudioProvider {...props}>
      <HostWorkbench variant={variant} />
    </HostStudioProvider>
  );
}
