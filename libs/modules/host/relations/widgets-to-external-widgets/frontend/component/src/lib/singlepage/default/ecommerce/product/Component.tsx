import { Component as Default } from "./default/Component";
import { IComponentProps as ICardDefaultComponentProps } from "./default/interface";

export function Component(props: ICardDefaultComponentProps) {
  if (props.variant === "default") {
    return (
      <Default
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
