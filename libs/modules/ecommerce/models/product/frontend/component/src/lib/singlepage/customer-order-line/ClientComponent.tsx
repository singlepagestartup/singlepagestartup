"use client";
import { useState } from "react";
import Image from "next/image";
import { Icon } from "@sps/ui-adapter";
export function ProductCover({ coverUrl }: { coverUrl?: string }) {
  const [failedCover, setFailedCover] = useState<string>();
  return (
    <span
      aria-hidden="true"
      className="grid size-12 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground sm:size-16"
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
