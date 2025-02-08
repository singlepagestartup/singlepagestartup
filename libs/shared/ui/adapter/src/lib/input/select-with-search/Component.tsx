"use client";

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  FormControl,
  Popover,
  PopoverContent,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";
import { useEffect, useMemo, useRef, useState } from "react";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<string | undefined>();
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(`${triggerRef.current.offsetWidth}px`);
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) {
      return props.options;
    }
    return props.options.filter((option) => {
      const filterValue = option[1] ?? option[0];

      const filterText = `${filterValue}`.toLowerCase();
      return filterText.includes(searchValue.trim().toLowerCase());
    });
  }, [searchValue, props.options]);

  const selectedOption = useMemo(() => {
    return props.options.find((option) => option[0] === props.field.value);
  }, [props.field.value, props.options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div ref={triggerRef}>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                props.className,
                !props.field.value && "text-muted-foreground",
              )}
            >
              {selectedOption
                ? selectedOption[2]
                  ? typeof selectedOption[2] === "function"
                    ? selectedOption[2](selectedOption)
                    : selectedOption[2]
                  : selectedOption[1]
                : props.placeholder}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </FormControl>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: triggerWidth }}>
        <Command className="w-full">
          <CommandInput
            placeholder={props.placeholder}
            className="h-9"
            value={searchValue}
            onValueChange={(value) => setSearchValue(value)}
          />
          <CommandList className="relative block max-h-60 overflow-y-auto border-t">
            <CommandEmpty>No found items.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const itemValue = `${option[0]} ${option[1]}`;
                return (
                  <CommandItem
                    key={option[0]}
                    value={itemValue}
                    onSelect={() => {
                      props.form.setValue(props.field.name, option[0]);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    {option[2]
                      ? typeof option[2] === "function"
                        ? option[2](option)
                        : option[2]
                      : option[1]}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedOption?.[0] === option[0]
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
