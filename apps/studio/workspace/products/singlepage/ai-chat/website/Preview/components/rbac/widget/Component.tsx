import type { ComponentProps, ComponentType } from "react";
import { Component as SubjectMeAccountSettings } from "./singlepage/subject-me-account-settings/index";
const variants = { "subject-me-account-settings": SubjectMeAccountSettings };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
