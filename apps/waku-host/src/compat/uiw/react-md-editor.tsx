"use client";

import type { ChangeEvent, CSSProperties, TextareaHTMLAttributes } from "react";

interface IMdEditorProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  height?: number;
  onChange?: (value?: string) => void;
}

export default function MdEditorCompat(props: IMdEditorProps) {
  const { value, height, onChange, style, ...rest } = props;

  const mergedStyle: CSSProperties = {
    minHeight: typeof height === "number" ? `${height}px` : undefined,
    ...style,
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <textarea
      {...rest}
      value={value ?? ""}
      onChange={handleChange}
      style={mergedStyle}
      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[160px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
