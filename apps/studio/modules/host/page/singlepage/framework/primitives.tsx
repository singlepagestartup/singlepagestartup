import { Component as SharedIcon } from "../../../../shared/icon";
import type { ComponentProps } from "react";
interface IIconProps
  extends Omit<
    Extract<ComponentProps<typeof SharedIcon>, { variant: "phosphor" }>,
    "variant"
  > {}
export type IconName = IIconProps["name"];
export function Icon(props: IIconProps) {
  return <SharedIcon {...props} variant="phosphor" />;
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
const button = `inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${focus}`;
export const kit = {
  button: `${button} bg-primary text-primary-foreground hover:brightness-95`,
  secondary: `${button} border border-border bg-card text-foreground hover:bg-muted`,
  plain: `${button} text-muted-foreground hover:text-foreground`,
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  field: `min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground disabled:opacity-60 ${focus}`,
};
