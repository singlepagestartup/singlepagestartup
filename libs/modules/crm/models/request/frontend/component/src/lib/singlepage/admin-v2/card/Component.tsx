import { IComponentPropsExtended } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/card/Component";

export function Component(props: IComponentPropsExtended) {
  return <ParentComponent {...props} />;
}
