import { IComponentProps } from "./interface";
import { Component as Default } from "./default/Component";
import { Component as SocialModule } from "./social-module/Component";
import { Component as EcommerceModule } from "./ecommerce-module/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "subject-overview-default") {
    return <Default {...props} />;
  }

  if (props.variant.startsWith("subject-overview-social-module")) {
    return <SocialModule {...props} />;
  }

  if (props.variant.startsWith("subject-overview-ecommerce-module")) {
    return <EcommerceModule {...props} />;
  }

  return <></>;
}
