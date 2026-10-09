import {
  HostWorkbench,
  HostStudioProvider,
  type IHostStudioProviderProps,
} from "./HostRecords/index";
export function HostPageComposition(
  props: Omit<IHostStudioProviderProps, "children"> = {},
) {
  return (
    <HostStudioProvider {...props}>
      <HostWorkbench />
    </HostStudioProvider>
  );
}
