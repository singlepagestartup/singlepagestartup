import { Component as Default } from "./default/Component";
import { Component as OverviewDefault } from "./overview-default/Component";
import { IComponentProps } from "./interface";
import { Component as RbacModuleSubjectProfileButtonDefault } from "./rbac-module-subject-profile-button-default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "default") {
    return (
      <Default
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
        data={props.data}
      />
    );
  }

  if (props.variant === "overview-default") {
    return (
      <OverviewDefault
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
        data={props.data}
      />
    );
  }

  if (props.variant === "rbac-module-subject-profile-button-default") {
    return (
      <RbacModuleSubjectProfileButtonDefault
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
        data={props.data}
      />
    );
  }

  return <></>;
}
