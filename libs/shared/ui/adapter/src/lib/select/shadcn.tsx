"use client";
import { Button } from "@sps/shared-ui-shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@sps/shared-ui-shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sps/shared-ui-shadcn/popover";
import { Check, ChevronDown } from "lucide-react";
import { forwardRef, useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@sps/shared-frontend-client-utils";
import { Icon } from "../icons";
import type { IComponentProps, ISelectOption } from "./interface";

function SelectItem({ option }: { option: ISelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      className="relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export const Component = forwardRef<HTMLButtonElement, IComponentProps>(
  function Component(
    {
      ui,
      id,
      className,
      contentClassName,
      search,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const [localOpen, setLocalOpen] = useState(props.defaultOpen ?? false);
    const [localValue, setLocalValue] = useState(props.defaultValue);
    const open = props.open ?? localOpen;
    function setOpen(next: boolean) {
      setLocalOpen(next);
      props.onOpenChange?.(next);
    }
    if (search) {
      const value = props.value ?? localValue;
      const groups = options.map((entry) =>
        "options" in entry ? entry : { label: undefined, options: [entry] },
      );
      const selected = groups
        .flatMap((group) => group.options)
        .find((item) => item.value === value);
      return (
        <Popover open={open && !props.disabled} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              ref={ref}
              id={id}
              aria-label={ariaLabel}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              disabled={props.disabled}
              className={cn("justify-between gap-2", className)}
            >
              <span className="truncate">{selected?.label ?? placeholder}</span>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={cn(
              "w-[var(--radix-popover-trigger-width)] p-2",
              contentClassName,
            )}
          >
            <Command label={search.placeholder} loop className="gap-2">
              <CommandInput
                aria-label={search.placeholder}
                placeholder={search.placeholder}
              />
              <CommandList>
                <CommandEmpty>{search.empty}</CommandEmpty>
                {groups.map(
                  (group) =>
                    group.options.length > 0 && (
                      <CommandGroup
                        key={group.label ?? group.options[0].value}
                        heading={group.label}
                      >
                        {group.options.map((item) => (
                          <CommandItem
                            key={item.value}
                            value={item.value}
                            keywords={[item.label]}
                            disabled={item.disabled}
                            aria-checked={item.value === value}
                            onSelect={() => {
                              if (item.value !== value) {
                                setLocalValue(item.value);
                                props.onValueChange?.(item.value);
                              }
                              setOpen(false);
                            }}
                          >
                            <Check
                              aria-hidden="true"
                              className={`size-4 ${item.value === value ? "" : "invisible"}`}
                            />
                            {item.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ),
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }
    return (
      <SelectPrimitive.Root
        {...props}
        onValueChange={(value) => {
          if (value) props.onValueChange?.(value);
        }}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "flex h-12 min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2 text-left text-sm font-normal text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 [&>span]:truncate",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <Icon
              name="caret-down"
              className="pointer-events-none text-muted-foreground"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-sps-theme="singlepage"
            position="popper"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-card font-default text-foreground shadow-md",
              contentClassName,
              search,
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
              <Icon name="caret-down" className="rotate-180" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) =>
                "options" in option ? (
                  option.options.length > 0 && (
                    <SelectPrimitive.Group key={option.label}>
                      <SelectPrimitive.Label className="py-1.5 pl-8 pr-3 text-xs font-medium text-muted-foreground">
                        {option.label}
                      </SelectPrimitive.Label>
                      {option.options.map((item) => (
                        <SelectItem key={item.value} option={item} />
                      ))}
                    </SelectPrimitive.Group>
                  )
                ) : (
                  <SelectItem key={option.value} option={option} />
                ),
              )}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
              <Icon name="caret-down" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);
