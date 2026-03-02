import { IComponentProps } from "./interface";

export function Component<M extends { id?: string }>(
  props: Partial<IComponentProps<M>>,
) {
  return (
    <div className={props.className} data-testid="error">
      Error
    </div>
  );
}
