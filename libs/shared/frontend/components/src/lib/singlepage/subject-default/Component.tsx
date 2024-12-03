import { IComponentPropsExtended, IComponentProps } from "./interface";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>>,
) {
  return (
    <div
      data-module="shared"
      data-model="model"
      data-variant={props.variant}
      className="w-full py-10 text-center flex flex-col gap-1"
    >
      <p className="font-bold">Shared variant</p>
      <p className="font-bold text-4xl">Model: model</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
