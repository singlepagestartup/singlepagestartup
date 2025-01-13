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
import { useMemo, useState } from "react";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) {
      return props.options;
    }

    return props.options.filter((option) => {
      let filterString = option[0].toString().toLowerCase();

      if (typeof option[1] === "string") {
        filterString += " " + option[1].toLowerCase();
      }

      const matched = filterString.includes(searchValue.trim().toLowerCase());

      return matched;
    });
  }, [searchValue, props.options]);

  const selectedOption = useMemo(() => {
    const renderOption = props.options.find((option) => {
      return option[0] === props.field.value;
    });

    return renderOption;
  }, [props.field.value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
              ? typeof selectedOption[1] === "function"
                ? selectedOption[1](selectedOption)
                : selectedOption[1]
              : props.placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-full">
          <CommandInput
            placeholder={props.placeholder}
            className="h-9"
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
            }}
          />
          <CommandList className="relative block max-h-60 overflow-y-auto border-t">
            <CommandEmpty>No found items.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                let value = option[0];

                if (typeof option[1] === "string") {
                  value += " " + option[1];
                }

                return (
                  <CommandItem
                    key={option[0]}
                    value={value}
                    onSelect={() => {
                      props.form.setValue(props.field.name, option[0]);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    {typeof option[1] === "function"
                      ? option[1](option)
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
