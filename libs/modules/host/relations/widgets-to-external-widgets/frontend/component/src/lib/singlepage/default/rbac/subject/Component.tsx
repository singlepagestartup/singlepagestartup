import { Component as SocialModuleProfileButtonDefault } from "./social-module-profile-button-default/Component";
import { Component as Me } from "./me/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "social-module-profile-button-default") {
    return (
      <SocialModuleProfileButtonDefault
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        variant={props.variant}
      />
    );
  }

  if (props.variant.startsWith("me-")) {
    return <Me {...props} />;
  }

  return <></>;
}
