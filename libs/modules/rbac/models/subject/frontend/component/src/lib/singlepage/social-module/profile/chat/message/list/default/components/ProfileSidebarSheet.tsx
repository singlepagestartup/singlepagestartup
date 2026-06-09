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
  onOpenChange: (open: boolean) => void;
}

export function ProfileSidebarSheet(props: ProfileSidebarSheetProps) {
  return (
    <Sheet open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Profile details</SheetTitle>
          <SheetDescription>
            Profile description, linked skills, and knowledge documents.
          </SheetDescription>
        </SheetHeader>
        {props.children}
      </SheetContent>
    </Sheet>
  );
}
