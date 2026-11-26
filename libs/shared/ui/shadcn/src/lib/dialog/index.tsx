"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { settingsFormStyles } from "../form/styles";
import { cn } from "@sps/shared-frontend-client-utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface IDialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  closeLabel?: string;
  overlayClassName?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  IDialogContentProps
>(
  (
    {
      className,
      children,
      closeLabel = "Close",
      overlayClassName,
      onOpenAutoFocus,
      onCloseAutoFocus,
      ...props
    },
    ref,
  ) => {
    const nestedOpener = React.useRef<HTMLElement | null>(null);
    return (
      <DialogPortal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          ref={ref}
          onOpenAutoFocus={(event) => {
            const opener = document.activeElement;
            const parent = opener?.closest('[role="dialog"]');
            const dialog = event.currentTarget;
            // A declarative Trigger already restores focus to itself.
            const hasTrigger =
              parent &&
              dialog instanceof HTMLElement &&
              Array.from(
                parent.querySelectorAll(
                  '[aria-haspopup="dialog"][aria-controls]',
                ),
              ).some(
                (button) => button.getAttribute("aria-controls") === dialog.id,
              );
            nestedOpener.current =
              parent && opener instanceof HTMLElement && !hasTrigger
                ? opener
                : null;
            onOpenAutoFocus?.(event);
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            const opener = nestedOpener.current;
            // Controlled editors may be opened from a parent dialog without a Radix Trigger.
            if (
              !onCloseAutoFocus &&
              !event.defaultPrevented &&
              opener?.isConnected &&
              !opener.closest('[aria-hidden="true"]')
            ) {
              event.preventDefault();
              opener.focus({ preventScroll: true });
            }
            nestedOpener.current = null;
          }}
          className={cn(
            "fixed left-[50%] top-[50%] z-40 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background gap-4 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className={
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            }
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function SettingsPanel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn(settingsFormStyles.panel, className)} {...props} />;
}

interface ISettingsDialogContentProps extends IDialogContentProps {
  flush?: boolean;
}

const SettingsDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ISettingsDialogContentProps
>(({ className, overlayClassName, flush, ...props }, ref) => (
  <DialogContent
    {...props}
    ref={ref}
    overlayClassName={cn("z-[65] bg-black/55", overlayClassName)}
    className={cn(
      settingsFormStyles.panel,
      "z-[70] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[54.5rem] gap-6 overflow-y-auto overscroll-contain sm:w-[calc(100%-3rem)] sm:rounded-2xl",
      "[&>button:last-child]:grid [&>button:last-child]:size-11 [&>button:last-child]:place-items-center [&>button:last-child]:rounded-xl [&>button:last-child]:border [&>button:last-child]:border-border [&>button:last-child]:bg-card [&>button:last-child]:opacity-100 [&>button:last-child]:shadow-sm [&>button:last-child:hover]:bg-muted [&>button:last-child>svg]:size-5",
      flush && "gap-0 p-0 sm:p-0",
      className,
    )}
  />
));
SettingsDialogContent.displayName = "SettingsDialogContent";

interface ISettingsDialogHeaderProps {
  title: string;
  description?: string;
}

function SettingsDialogHeader({
  title,
  description,
}: ISettingsDialogHeaderProps) {
  return (
    <header className="pr-14">
      <DialogTitle className={settingsFormStyles.title}>{title}</DialogTitle>
      {description && (
        <DialogDescription className={settingsFormStyles.description}>
          {description}
        </DialogDescription>
      )}
    </header>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  SettingsDialogContent,
  SettingsDialogHeader,
  SettingsPanel,
};
