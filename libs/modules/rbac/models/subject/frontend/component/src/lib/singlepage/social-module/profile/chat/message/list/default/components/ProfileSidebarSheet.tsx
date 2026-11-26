"use client";

import {
  Dialog,
  SettingsDialogContent,
  DialogDescription,
  DialogTitle,
} from "@sps/shared-ui-shadcn";
import { useRef, type ReactNode } from "react";

interface ProfileSidebarSheetProps {
  children: ReactNode;
  isOpen: boolean;
  language?: string;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
  summaryOnly?: boolean;
}

export function ProfileSidebarSheet(props: ProfileSidebarSheetProps) {
  const title = useRef<HTMLHeadingElement>(null);
  const ru = props.language === "ru";
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SettingsDialogContent
        flush
        overlayClassName="z-50"
        className="z-50 flex flex-col overflow-hidden"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          title.current?.focus({ preventScroll: true });
        }}
        closeLabel={ru ? "Закрыть профиль" : "Close profile"}
        onCloseAutoFocus={props.onCloseAutoFocus}
      >
        <div className="sr-only">
          <DialogTitle tabIndex={-1} ref={title}>
            {ru ? "Данные профиля" : "Profile details"}
          </DialogTitle>
          <DialogDescription>
            {props.summaryOnly
              ? ru
                ? "Данные участника чата."
                : "Chat participant details."
              : ru
                ? "Описание профиля, навыки, знания и инструменты."
                : "Profile description, skills, knowledge and tools."}
          </DialogDescription>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {props.children}
        </div>
      </SettingsDialogContent>
    </Dialog>
  );
}
