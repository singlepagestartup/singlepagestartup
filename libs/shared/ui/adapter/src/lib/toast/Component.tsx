"use client";

import { Toaster as Sonner } from "sonner";
import { ToastIcon } from "./icons";
import type { IToasterProps } from "./interface";

const button =
  "col-end-[-1] mt-3 min-h-8 max-w-full cursor-pointer justify-self-start rounded-full border border-current/20 bg-transparent px-4 py-1 text-sm font-medium leading-5 hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

export function Toaster({
  position = "bottom-right",
  duration = 4500,
  className = "",
  ...props
}: IToasterProps) {
  return (
    <Sonner
      {...props}
      position={position}
      duration={duration}
      richColors={false}
      closeButton
      className={
        "sps-toaster group/toaster font-default min-[601px]:[--width:26.5rem]! max-[600px]:left-(--mobile-offset-left)! max-[600px]:right-(--mobile-offset-right)! max-[600px]:w-auto! " +
        className
      }
      icons={{
        success: <ToastIcon type="success" />,
        error: <ToastIcon type="error" />,
        warning: <ToastIcon type="warning" />,
        info: <ToastIcon type="info" />,
        loading: <ToastIcon type="loading" />,
        close: <ToastIcon type="close" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group/toast grid w-full! grid-cols-[minmax(0,1fr)] items-start gap-x-4 rounded-[1.125rem] border border-border bg-card bg-linear-to-r to-transparent p-4 font-default text-card-foreground shadow-[0_2px_5px_rgb(0_0_0/0.035),0_7px_22px_rgb(0_0_0/0.055)] has-[[data-icon]]:grid-cols-[auto_minmax(0,1fr)] has-[[data-close-button]]:pe-11 sm:gap-x-5 sm:p-[1.125rem] sm:has-[[data-close-button]]:pe-12 group-data-[sonner-theme=dark]/toaster:border-zinc-700 group-data-[sonner-theme=dark]/toaster:bg-zinc-900 group-data-[sonner-theme=dark]/toaster:text-zinc-100 [&>[data-content]~*]:col-end-[-1] [&[data-expanded=false][data-front=false]>*]:opacity-0",
          success: "from-green-500/5",
          warning: "from-orange-500/5",
          error: "from-rose-500/5",
          info: "from-sky-500/5",
          loading: "from-slate-500/5",
          default: "from-slate-500/5",
          icon: "relative col-start-1 row-start-1 grid size-11 place-items-center sm:size-12",
          content:
            "col-end-[-1] row-start-1 grid min-w-0 gap-1.5 self-center has-[[data-description]]:self-start",
          title:
            "text-[0.9375rem] font-normal leading-5 group-has-[[data-description]]/toast:text-base group-has-[[data-description]]/toast:font-medium group-has-[[data-description]]/toast:leading-[1.375rem]",
          description:
            "text-[0.9375rem] leading-5 text-muted-foreground! group-data-[sonner-theme=dark]/toaster:text-zinc-300!",
          actionButton: button,
          cancelButton: button,
          closeButton:
            "absolute end-3 top-3 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-transparent! text-current/55! hover:bg-current/5! hover:text-current! focus-visible:outline-2 focus-visible:outline-current",
        },
      }}
    />
  );
}
