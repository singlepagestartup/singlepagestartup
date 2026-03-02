import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: { className?: string }) {
  return <ClientComponent className={props.className} />;
}
