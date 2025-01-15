import { IComponentProps } from "./interface";

export function Skeleton(props: IComponentProps) {
  return (
    <div className={props.containerClassName ?? ""}>
      <div className="absolute inset-0 skeleton"></div>
    </div>
  );
}
