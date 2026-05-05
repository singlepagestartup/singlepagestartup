import { IContentEntityDescriptor } from "./types";

export interface IMergeLocalizedFieldProps {
  descriptor: IContentEntityDescriptor;
  current: Record<string, any>;
  field: string;
  locale: string;
  value: string;
}

export function mergeLocalizedField(props: IMergeLocalizedFieldProps) {
  if (!props.descriptor.localizedFields.includes(props.field)) {
    throw new Error(
      `Validation error. ${props.descriptor.key}.${props.field} is not a localized field`,
    );
  }

  const currentValue = props.current[props.field];
  const currentLocalizedValue =
    currentValue === undefined || currentValue === null ? {} : currentValue;

  if (
    typeof currentLocalizedValue !== "object" ||
    Array.isArray(currentLocalizedValue)
  ) {
    throw new Error(
      `Validation error. ${props.descriptor.key}.${props.field} must be a locale-keyed object`,
    );
  }

  return {
    ...(currentLocalizedValue as Record<string, string | undefined>),
    [props.locale]: props.value,
  };
}

export function buildLocalizedFieldPatch(props: IMergeLocalizedFieldProps) {
  return {
    [props.field]: mergeLocalizedField(props),
  };
}
