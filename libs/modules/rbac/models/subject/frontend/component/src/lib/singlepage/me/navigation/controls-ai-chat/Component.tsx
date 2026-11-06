import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      language={props.language}
      socialModuleProfileId={props.socialModuleProfileId}
      socialModuleChatId={props.socialModuleChatId}
      settingsSelected={props.settingsSelected}
    />
  );
}
