"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "../button";

interface IImageUploadFieldProps {
  language: string;
  label: string;
  chooseLabel: string;
  savedLabel: string;
  preview: ReactNode;
  pending: boolean;
  allowGif?: boolean;
  canRemove: boolean;
  onSave: (data: { file: File } | { reset: true }) => Promise<unknown>;
}

const imageTypes = ["image/png", "image/jpeg", "image/webp"];

export function ImageUploadField(props: IImageUploadFieldProps) {
  const ru = props.language === "ru";
  const acceptedTypes = props.allowGif
    ? [...imageTypes, "image/gif"]
    : imageTypes;
  const formats = props.allowGif ? "PNG, JPEG, WebP, GIF" : "PNG, JPEG, WebP";
  const [status, setStatus] = useState("");
  async function save(data: { file: File } | { reset: true }) {
    setStatus("");
    if (
      "file" in data &&
      (!acceptedTypes.includes(data.file.type) ||
        data.file.size > 2 * 1024 * 1024)
    ) {
      setStatus(
        ru
          ? `Выберите изображение до 2 МБ (${formats}).`
          : `Choose an image up to 2 MB (${formats}).`,
      );
      return;
    }
    try {
      await props.onSave(data);
      setStatus(props.savedLabel);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось сохранить изображение."
            : "Could not save the image.",
      );
    }
  }
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-sm font-semibold">{props.label}</p>
      <div className="flex flex-wrap items-center gap-4">
        {props.preview}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 max-w-full cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2">
              {ru ? "Выбрать изображение" : "Choose image"}
              <input
                type="file"
                aria-label={props.chooseLabel}
                accept={acceptedTypes.join(",")}
                disabled={props.pending}
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void save({ file });
                }}
              />
            </label>
            {props.canRemove && (
              <Button
                type="button"
                variant="outline"
                disabled={props.pending}
                onClick={() => void save({ reset: true })}
              >
                {ru ? "Удалить" : "Remove"}
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ru
              ? `${formats}, до 2 МБ. Изменение изображения сохраняется сразу.`
              : `${formats}, up to 2 MB. Image changes save immediately.`}
          </p>
        </div>
      </div>
      {status && (
        <p role="status" className="text-sm">
          {status}
        </p>
      )}
    </div>
  );
}
