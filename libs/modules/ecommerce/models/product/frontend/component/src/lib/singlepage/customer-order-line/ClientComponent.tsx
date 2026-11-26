"use client";
import { useState } from "react";
import Image from "next/image";
import { Icon } from "@sps/ui-adapter";
export function ProductCover({ coverUrl }: { coverUrl?: string }) {
  const [failedCover, setFailedCover] = useState<string>();
  return (
    <span
      aria-hidden="true"
      className="row-span-2 grid size-16 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground sm:row-span-1 sm:size-20"
    >
      {coverUrl && coverUrl !== failedCover ? (
        <Image
          unoptimized
          src={coverUrl}
          alt=""
          width={80}
          height={80}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedCover(coverUrl)}
        />
      ) : (
        <Icon name="package" size={24} />
      )}
    </span>
  );
}
