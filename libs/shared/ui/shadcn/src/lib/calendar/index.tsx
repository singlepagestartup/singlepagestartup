"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "../button";
import { cn } from "@sps/shared-frontend-client-utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("", className)}
      classNames={{
        months: "flex flex-col sm:flex-row items-start gap-2 relative",
        month: "flex flex-col gap-4",
        month_caption: "flex pt-1 pl-1 relative items-center w-fit",
        caption_label: "font-medium",
        nav: "flex items-center gap-1 absolute right-0 top-0 z-10",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        day: cn(
          "relative text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "border border-input p-3 font-normal aria-selected:opacity-100 rounded-md hover:border-primary hover:bg-primary hover:text-primary-foreground aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-foreground",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "[&>button]:bg-primary [&>button]:border-primary text-primary-foreground",
        today: "[&>button]:bg-input text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return (
              <div
                className={cn(buttonVariants({ variant: "outline" }), "p-1")}
              >
                <ChevronLeft className={cn("size-3", className)} {...props} />
              </div>
            );
          }
          return (
            <div className={cn(buttonVariants({ variant: "outline" }), "p-1")}>
              <ChevronRight className={cn("size-3", className)} {...props} />
            </div>
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
