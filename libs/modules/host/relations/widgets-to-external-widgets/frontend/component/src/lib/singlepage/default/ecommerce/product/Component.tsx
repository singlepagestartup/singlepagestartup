import { Component as CardDefault } from "./card-default/Component";
import { IComponentProps as ICardDefaultComponentProps } from "./card-default/interface";

export function Component(props: ICardDefaultComponentProps) {
  if (props.variant === "card-default") {
    return (
      <CardDefault
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
        data={props.data}
        billingModuleCurrencyId={props.billingModuleCurrencyId}
      />
    );
  }

  return <></>;
}
