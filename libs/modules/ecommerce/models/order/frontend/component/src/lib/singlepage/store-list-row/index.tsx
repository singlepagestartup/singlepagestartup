import { Component as Reader } from "@sps/shared-frontend-components/singlepage/reader";
import { Component as View } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <Reader dataSource="props" Component={View} componentProps={props} />;
}
