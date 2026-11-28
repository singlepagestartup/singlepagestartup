import { CustomerOrderFrame } from "../CustomerOrderFrame";
import { ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || "en";
  return (
    <CustomerOrderFrame
      isServer={props.isServer}
      language={language}
      widgetId={props.data.id}
      variant={props.variant}
    >
      <ClientComponent language={language} />
    </CustomerOrderFrame>
  );
}
