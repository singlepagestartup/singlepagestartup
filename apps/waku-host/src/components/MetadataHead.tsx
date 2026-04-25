import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";

type TIcon = {
  url: string;
};

function getTitle(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.default || record.absolute || "");
  }

  return String(value);
}

function getIcons(value: unknown): TIcon[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is TIcon => Boolean(item?.url));
  }

  if (value && typeof value === "object") {
    const record = value as { icon?: TIcon[] };
    return Array.isArray(record.icon) ? record.icon : [];
  }

  return [];
}

export async function MetadataHead(props: { url: string }) {
  const metadata = (await metadataApi.generate({
    catchErrors: true,
    url: props.url,
  })) as Record<string, any> | undefined;

  const title = getTitle(metadata?.title);
  const description = String(metadata?.description || "");
  const keywords = Array.isArray(metadata?.keywords)
    ? metadata.keywords.join(",")
    : "";
  const icons = getIcons(metadata?.icons);
  const image =
    String(metadata?.openGraph?.images || "") ||
    String(metadata?.twitter?.images || "") ||
    String(metadata?.image || "");

  return (
    <>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {metadata?.url ? <link rel="canonical" href={metadata.url} /> : null}
      {icons.map((icon) => (
        <link key={icon.url} rel="icon" href={icon.url} />
      ))}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      {metadata?.url ? <meta property="og:url" content={metadata.url} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? (
        <meta name="twitter:description" content={description} />
      ) : null}
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  );
}
