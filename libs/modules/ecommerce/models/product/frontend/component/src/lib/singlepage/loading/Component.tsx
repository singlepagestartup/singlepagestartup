import { Component as Skeleton } from "../default/Skeleton";
import type { IComponentProps } from "./interface";
export function Component(_props: IComponentProps) {
  return (
    <div data-module="ecommerce" data-model="product" data-variant="loading">
      <Skeleton />
    </div>
  );
}
