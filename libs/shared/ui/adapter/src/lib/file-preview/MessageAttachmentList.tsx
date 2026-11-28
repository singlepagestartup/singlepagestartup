"use client";

import { useState, type ReactNode } from "react";

interface IProps<T> {
  items: T[];
  language: string;
  label: string;
  itemId: (item: T) => string;
  isPhoto: (item: T) => boolean;
  children: (item: T) => ReactNode;
}

export function MessageAttachmentList<T>(props: IProps<T>) {
  const [photoLimit, setPhotoLimit] = useState(6);
  const photos: T[] = [];
  const files: T[] = [];
  for (const item of props.items) {
    const group = props.isPhoto(item) ? photos : files;
    group.push(item);
  }
  return (
    <ul
      aria-label={props.label}
      className="grid w-full min-w-0 grid-cols-2 gap-2"
    >
      {photos.slice(0, photoLimit).map((item) => (
        <li key={props.itemId(item)} className="min-w-0">
          {props.children(item)}
        </li>
      ))}
      {photos.length > photoLimit && (
        <li className="col-span-2">
          <button
            type="button"
            onClick={() => setPhotoLimit((current) => current + 6)}
            className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {props.language === "ru" ? "Показать ещё фото" : "Show more photos"}{" "}
            ({photos.length - photoLimit})
          </button>
        </li>
      )}
      {files.map((item) => (
        <li key={props.itemId(item)} className="col-span-2 min-w-0">
          {props.children(item)}
        </li>
      ))}
    </ul>
  );
}
