"use client";

import {
  DateTimePicker,
  FormControl,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FileInputRoot,
  TipTap,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Label,
  ToggleGroup,
  ToggleGroupItem,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SelectWithSearch } from "./select-with-search/Component";

const Placeholder = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      Select file
    </div>
  );
};

export const Component = (props: IComponentProps) => {
  if (props.type === "text" || props.type === "password") {
    return (
      <FormControl>
        <Input
          placeholder={props.placeholder}
          {...props.field}
          value={typeof props.field.value === "string" ? props.field.value : ""}
          type={props.type}
          className={props.className}
        />
      </FormControl>
    );
  }

  if (props.type === "tiptap") {
    return (
      <FormControl>
        <TipTap
          placeholder={props.placeholder}
          {...props.field}
          form={props.form}
          className={props.className}
          editable={true}
        />
      </FormControl>
    );
  }

  if (props.type === "textarea") {
    return (
      <FormControl>
        <textarea
          {...props.field}
          placeholder={props.placeholder}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            props.className,
          )}
        />
      </FormControl>
    );
  }

  if (props.type === "file") {
    return (
      <FormControl>
        <FileInputRoot
          placeholder={props.placeholder}
          {...props.field}
          form={props.form}
          className={props.className}
        >
          <Placeholder />
          <div className="bg-green-300 p-3 opacity-10"></div>
        </FileInputRoot>
      </FormControl>
    );
  }

  if (props.type === "number") {
    return (
      <FormControl>
        <Input
          placeholder={props.placeholder}
          type="number"
          {...props.field}
          value={
            typeof props.field.value === "number" && !isNaN(props.field.value)
              ? props.field.value
              : ""
          }
          min={props.min}
          max={props.max}
          step={props.step}
          className={props.className}
          onChange={(event) => {
            const value = event.target.value === "" ? "" : +event.target.value;
            props.field.onChange(value);
          }}
        />
      </FormControl>
    );
  }

  if (props.type === "datetime") {
    return (
      <FormControl>
        <DateTimePicker
          {...props.field}
          mode="single"
          placeholder={props.placeholder}
          value={props.field.value}
          onChange={props.field.onChange}
          className={props.className}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
        />
      </FormControl>
    );
  }

  if (props.type === "checkbox") {
    return (
      <FormControl>
        <Checkbox
          {...props.field}
          className={props.className}
          checked={props.field.value}
          onCheckedChange={props.field.onChange}
        />
      </FormControl>
    );
  }

  if (props.type === "select") {
    return (
      <Select
        onValueChange={props.field.onChange}
        defaultValue={props.field.value}
        disabled={props.disabled}
      >
        <FormControl>
          <SelectTrigger className={props.className}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent className={props.selectContentClassName}>
          {props.options.map((option, index) => {
            return (
              <SelectItem
                key={index}
                value={option[0]}
                className={props.selectItemClassName}
              >
                {option[2]
                  ? typeof option[2] === "function"
                    ? option[2](option)
                    : option[2]
                  : option[1]}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (props.type === "select-with-search") {
    return <SelectWithSearch {...props} />;
  }

  if (props.type === "radio") {
    return (
      <RadioGroup
        onValueChange={props.field.onChange}
        defaultValue={props.field.value}
        disabled={props.disabled}
        className={props.className}
      >
        {props.options.map((option, index) => {
          return (
            <div key={index} className={props.itemClassName}>
              <RadioGroupItem
                value={option[0]}
                id={option[0]}
                className={props.radioGroupItemClassName}
              />
              <Label htmlFor={option[0]} className={props.labelClassName}>
                {option[2]
                  ? typeof option[2] === "function"
                    ? option[2](option)
                    : option[2]
                  : option[1]}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  }

  if (props.type === "toggle-group") {
    return (
      <ToggleGroup
        type="single"
        onValueChange={props.field.onChange}
        defaultValue={props.field.value}
        disabled={props.disabled}
        className={props.className}
      >
        {props.options.map((option, index) => {
          return (
            <ToggleGroupItem
              key={index}
              className={props.itemClassName}
              value={option[0]}
            >
              {option[2]
                ? typeof option[2] === "function"
                  ? option[2](option)
                  : option[2]
                : option[1]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    );
  }

  return <div>Unknown input type</div>;
};
