import React from "react";
import { IComponentProps } from "./interface";
import { Component as GenerateTemplateOpengraphImageDefault } from "./singlepage/generate-template-opengraph-image-default";
import { Component as GenerateTemplateEcommerceOrderReceiptDefault } from "./singlepage/generate-template-ecommerce-order-receipt-default";
import { Component as GenerateTemplateEcommerceProductAttachmentDefault } from "./singlepage/generate-template-ecommerce-product-attachment-default";

/**
 * Impossible to use object key for dynamic import, throws and error with pipe response
 */
export function Component(props: IComponentProps) {
  if (props.variant === "generate-template-opengraph-image-default") {
    return <GenerateTemplateOpengraphImageDefault {...props} />;
  } else if (
    props.variant === "generate-template-ecommerce-order-receipt-default"
  ) {
    return <GenerateTemplateEcommerceOrderReceiptDefault {...props} />;
  } else if (
    props.variant === "generate-template-ecommerce-product-attachment-default"
  ) {
    return <GenerateTemplateEcommerceProductAttachmentDefault {...props} />;
  }

  return <div></div>;
}
