import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      dataSource="props"
      Component={ChildComponent}
      componentProps={props}
    />
  );
}
