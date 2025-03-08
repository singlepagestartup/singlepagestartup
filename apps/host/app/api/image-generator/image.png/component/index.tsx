import React from "react";
import { IComponentProps } from "./interface";
import { Component as OpengraphImage } from "./singlepage/opengraph-image/Component";
import { Component as OrderReceipt } from "./singlepage/order-receipt/Component";

/**
 * Impossible to use object key for dynamic import, throws and error with pipe response
 */
export function Component(props: IComponentProps) {
  if (props.variant === "opengraph-image") {
    return <OpengraphImage {...props} />;
  } else if (props.variant === "order-receipt") {
    return <OrderReceipt {...props} />;
  }

  return <div></div>;
}
