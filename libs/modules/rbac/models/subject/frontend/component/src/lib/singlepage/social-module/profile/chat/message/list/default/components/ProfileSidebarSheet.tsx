"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@sps/shared-ui-shadcn";
import type { ReactNode } from "react";

interface ProfileSidebarSheetProps {
  children: ReactNode;
  isOpen: boolean;
  language?: string;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSidebarSheet(props: ProfileSidebarSheetProps) {
  const ru = props.language === "ru";
  return (
    <Sheet open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SheetContent
        className="flex w-full flex-col p-0 sm:max-w-md"
        closeLabel={ru ? "Закрыть профиль" : "Close profile"}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{ru ? "Данные профиля" : "Profile details"}</SheetTitle>
          <SheetDescription>
            {ru
              ? "Описание профиля, навыки, знания и инструменты."
              : "Profile description, skills, knowledge and tools."}
          </SheetDescription>
        </SheetHeader>
        {props.children}
      </SheetContent>
    </Sheet>
  );
}
