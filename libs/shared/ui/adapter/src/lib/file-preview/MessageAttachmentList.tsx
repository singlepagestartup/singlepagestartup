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
  let photos = 0;
  const rows = props.items.map((item) => {
    const photo = props.isPhoto(item);
    if (photo && ++photos > photoLimit) return null;
    return (
      <li
        key={props.itemId(item)}
        className={photo ? "min-w-0" : "col-span-2 min-w-0"}
      >
        {props.children(item)}
      </li>
    );
  });
  return (
    <div className="grid w-full min-w-0 gap-2">
      <ul aria-label={props.label} className="grid min-w-0 grid-cols-2 gap-2">
        {rows}
      </ul>
      {photos > photoLimit && (
        <button
          type="button"
          onClick={() => setPhotoLimit((current) => current + 6)}
          className="justify-self-start rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {props.language === "ru" ? "Показать ещё фото" : "Show more photos"} (
          {photos - photoLimit})
        </button>
      )}
    </div>
  );
}
