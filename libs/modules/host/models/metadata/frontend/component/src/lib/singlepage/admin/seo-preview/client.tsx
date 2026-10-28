"use client";
import { useState, useId } from "react";
import { useWatch, type FieldValues } from "react-hook-form";
import { internationalization } from "@sps/shared-configuration";
import { api } from "@sps/host/models/metadata/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export function Component<T extends FieldValues>({
  control,
  metadataId,
}: IComponentProps<T>) {
  const id = useId();
  const draft = useWatch({ control });
  const [url, setUrl] = useState("/");
  const [language, setLanguage] = useState(
    internationalization.defaultLanguage.code,
  );
  const query = api.preview({
    url,
    language,
    metadata: { ...draft, ...(metadataId ? { id: metadataId } : {}) },
  });
  const result = query.data;
  const title =
    typeof result?.metadata.title === "string" ? result.metadata.title : "";
  const images = result?.metadata.openGraph?.images;
  const firstImage = Array.isArray(images) ? images[0] : images;
  const image =
    typeof firstImage === "string"
      ? firstImage
      : firstImage && "url" in firstImage
        ? String(firstImage.url)
        : "";
  const robots = result?.metadata.robots;
  const indexable =
    typeof robots === "object" && robots !== null
      ? robots.index !== false
      : !String(robots || "").includes("noindex");
  return (
    <ChildComponent
      id={id}
      url={url}
      language={language}
      setUrl={setUrl}
      setLanguage={setLanguage}
      onPreview={() => void query.refetch()}
      isFetching={query.isFetching}
      error={query.error?.message}
      result={result}
      title={title}
      image={image}
      indexable={indexable}
    />
  );
}
