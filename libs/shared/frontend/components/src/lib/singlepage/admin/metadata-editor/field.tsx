"use client";
import { useRef } from "react";
import type { IEntityMetadata } from "@sps/shared-utils/metadata";
import {
  useController,
  type FieldValues,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import { Component } from "./Component";
import { internationalization } from "@sps/shared-configuration";
export function MetadataField<T extends FieldValues>({
  form,
}: {
  form: UseFormReturn<T>;
}) {
  const name = "metadata" as FieldPath<T>;
  const { field } = useController({ control: form.control, name });
  const lastValid = useRef<IEntityMetadata>({});
  if (field.value && typeof field.value === "object")
    lastValid.current = field.value;
  return (
    <Component
      value={lastValid.current}
      language={internationalization.defaultLanguage.code}
      onChange={field.onChange}
      onValidityChange={(valid) => {
        if (valid) form.clearErrors(name);
        else {
          field.onChange(null);
          form.setError(name, {
            message: "Correct the metadata JSON before saving",
          });
        }
      }}
    />
  );
}
