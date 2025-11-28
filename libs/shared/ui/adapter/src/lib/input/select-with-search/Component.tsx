"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentProps) {
  const [searchValue, setSearchValue] = useState("");

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
    <Command
      className={cn("w-full border rounded-md border-input", props.className)}
    >
      <CommandInput
        placeholder={props.placeholder}
        className="h-9"
        value={searchValue}
        onValueChange={(value) => setSearchValue(value)}
      />
      <CommandList className="relative block w-full h-40 overflow-y-auto border-t">
        <CommandEmpty className="mt-16 text-center text-muted-foreground">
          No found items.
        </CommandEmpty>
        <CommandGroup>
          {filteredOptions.map((option) => {
            const itemValue = `${option[0]} ${option[1]}`;
            return (
              <CommandItem
                key={option[0]}
                value={itemValue}
                onSelect={() => {
                  props.form.setValue(props.field.name, option[0]);
                  setSearchValue("");
                }}
                data-is-selected={selectedOption?.[0] === option[0]}
                className="cursor-pointer data-[is-selected=true]:bg-accent data-[is-selected=true]:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "mr-1",
                    selectedOption?.[0] === option[0]
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />

                {option[2]
                  ? typeof option[2] === "function"
                    ? option[2](option)
                    : option[2]
                  : option[1]}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
