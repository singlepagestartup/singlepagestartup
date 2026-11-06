import type { IComponentProps } from "./interface";
export function toastContract() {
  const notification: IComponentProps = {
    variant: "default",
    type: "success",
    title: "Saved",
  };
  const icons: IComponentProps = { variant: "icons" };
  // @ts-expect-error unknown notification type
  const wrongType: IComponentProps = { variant: "default", type: "unknown" };
  // @ts-expect-error icons do not accept notification text
  const wrongVariant: IComponentProps = { variant: "icons", title: "Saved" };
  return { notification, icons, wrongType, wrongVariant };
}
