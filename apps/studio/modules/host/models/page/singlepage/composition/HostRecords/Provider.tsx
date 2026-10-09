import {
  HostStudioProvider as StateProvider,
  type IHostStudioProviderProps,
} from "./Context";
import { HostRelationManager } from "./Relations";

export function HostStudioProvider(props: IHostStudioProviderProps) {
  return (
    <StateProvider
      {...props}
      RelationManager={props.RelationManager ?? HostRelationManager}
    />
  );
}
