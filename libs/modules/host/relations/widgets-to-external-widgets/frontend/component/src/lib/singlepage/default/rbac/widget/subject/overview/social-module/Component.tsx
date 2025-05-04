import { IComponentProps } from "./interface";
import { Component as Profile } from "./profile/Component";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("subject-overview-social-module-profile")) {
    return <Profile {...props} />;
  }

  return <></>;
}
