import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { twMerge } from "tailwind-merge";
import { kit } from "./primitives";

export const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
export const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[var(--workspace-brand-accent)]";

export const SectionTabsRoot = Tabs.Root;
export const SectionTabsContent = Tabs.Content;

export const SectionTabsList = forwardRef<
  ElementRef<typeof Tabs.List>,
  ComponentPropsWithoutRef<typeof Tabs.List>
>(function SectionTabsList({ className, ...props }, ref) {
  return (
    <Tabs.List
      ref={ref}
      className={twMerge(
        "flex flex-wrap gap-1 rounded-xl bg-[var(--workspace-brand-background)] p-1",
        className,
      )}
      {...props}
    />
  );
});

export const SectionTabsTrigger = forwardRef<
  ElementRef<typeof Tabs.Trigger>,
  ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(function SectionTabsTrigger({ className, children, ...props }, ref) {
  return (
    <Tabs.Trigger
      ref={ref}
      className={twMerge(
        sectionChoiceClass,
        "group text-[var(--workspace-brand-muted)] hover:text-[var(--workspace-brand-foreground)] data-[state=active]:bg-[var(--workspace-brand-surface)] data-[state=active]:text-[var(--workspace-brand-foreground)]",
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={`${sectionIndicatorClass} hidden group-data-[state=active]:block`}
      />
    </Tabs.Trigger>
  );
});
