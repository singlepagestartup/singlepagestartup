import { ReactNode } from "react";

export type IProps = {
  title: string;
  children: ReactNode;
};

export function Component(props: IProps) {
  return (
    <div className="p-3 rounded-md border border-input flex flex-col gap-3 w-full">
      <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {props.title}
      </p>
      {props.children}
    </div>
  );
}
