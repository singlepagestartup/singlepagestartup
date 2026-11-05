import type { ToasterProps } from "sonner";

export interface IToasterProps
  extends Pick<
    ToasterProps,
    | "position"
    | "duration"
    | "expand"
    | "visibleToasts"
    | "offset"
    | "mobileOffset"
    | "containerAriaLabel"
    | "pauseWhenPageIsHidden"
    | "theme"
  > {
  className?: string;
}

export interface IToastIconProps {
  type:
    | "default"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "loading"
    | "close";
  className?: string;
}
