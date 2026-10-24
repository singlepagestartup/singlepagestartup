import { Presentation } from "../content-offer/Component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <Presentation
      data={props.data}
      isServer={props.isServer}
      language={props.language}
      className={props.className}
      children={props.children}
      card
      variant="content-offer-card"
    />
  );
}
