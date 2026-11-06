"use client";
import { Toaster as Sonner } from "sonner";
import { ToastIcon } from "./icons";
import type { IToasterProps } from "./interface";

/** The application and Studio mount this same UI-only notification renderer. */
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
      className={"sps-toaster font-default " + className}
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
            "group toast grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 rounded-xl border border-border bg-card p-4 pr-11 font-default text-foreground shadow-md outline-none [&:not(:has([data-icon]))_[data-content]]:col-span-2 [&:not(:has([data-icon]))_[data-content]]:col-start-1",
          icon: "!m-0 !size-9 !items-start !justify-center",
          content: "col-start-2 min-w-0 !gap-1",
          title: "text-sm !font-semibold !leading-5",
          description: "break-words text-sm !leading-5 !text-muted-foreground",
          actionButton:
            "col-start-2 mt-3 min-h-9 justify-self-start rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          cancelButton:
            "col-start-2 mt-2 min-h-9 justify-self-start rounded-lg bg-muted px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          closeButton:
            "!left-auto !right-2 !top-2 !size-7 !transform-none !rounded-lg !border-0 !bg-transparent !text-muted-foreground hover:!bg-muted hover:!text-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring",
        },
      }}
    />
  );
}
