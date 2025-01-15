import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="pages-to-metadata"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-full py-10 text-center flex flex-col gap-1"
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Relation: pages-to-metadata</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
