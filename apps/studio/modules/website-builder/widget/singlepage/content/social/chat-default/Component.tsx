import { twMerge } from "tailwind-merge";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="website-builder"
      data-model="widget"
      data-variant={props.variant || "content-social-chat-default"}
      className={twMerge("w-full flex flex-col", props.className)}
    >
      {props.children}
    </div>
  );
}
