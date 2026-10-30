"use client";
import { useState, useId } from "react";
import { useWatch } from "react-hook-form";
import { internationalization } from "@sps/shared-configuration";
import { resolveSeoRoute } from "@sps/shared-utils";
import { api } from "@sps/host/models/page/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client({ control, metadataId }: IComponentProps) {
  const id = useId();
  const draft = useWatch({ control });
  const [url, setUrl] = useState("/");
  const [language, setLanguage] = useState(
    internationalization.defaultLanguage.code,
  );
  const pathname = resolveSeoRoute(
    url,
    internationalization.languages.map(({ code }) => code),
    language,
  ).pathname;
  const query = api.previewSeo({
    url: `/${language}${pathname === "/" ? "" : pathname}`,
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
      setUrl={(value) => {
        setUrl(value);
        const prefix = value.split("/")[1];
        if (internationalization.languages.some(({ code }) => code === prefix))
          setLanguage(prefix);
      }}
      setLanguage={(value) => {
        setLanguage(value);
        setUrl(`/${value}${pathname === "/" ? "" : pathname}`);
      }}
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
