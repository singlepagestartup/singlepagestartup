import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      accountProfile={props.accountProfile}
      accountIdentities={props.accountIdentities}
      accountAvatar={props.accountAvatar}
      accountBalance={props.accountBalance}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      language={props.language}
      settingsSelected={props.settingsSelected}
    />
  );
}
