import { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { ReduxProvider } from "@sps/sps-rbac-relations-users-to-identities-frontend-redux";

export function Component(props: IComponentProps) {
  const Comp = props.isServer ? Server : Client;

  return (
    <ReduxProvider>
      <Comp {...props} />
    </ReduxProvider>
  );
}
