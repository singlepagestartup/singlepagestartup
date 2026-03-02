import { IComponentProps } from "./interface";

export function Component(props: Partial<IComponentProps>) {
  return (
    <div className={props.className} data-testid="skeleton">
      Loading...
    </div>
  );
}
