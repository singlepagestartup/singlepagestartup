import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <p
      data-module="sps-billing"
      data-model="currency"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="text-md font-bold"
    >
      {props.data.unicode}
    </p>
  );
}
