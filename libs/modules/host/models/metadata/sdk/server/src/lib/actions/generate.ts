import { api } from "@sps/host/models/metadata/sdk/server";
import {
  HOST_URL,
  NEXT_PUBLIC_HOST_METADATA_TITLE,
  NEXT_PUBLIC_HOST_METADATA_DESCRIPTION,
  NEXT_PUBLIC_HOST_METADATA_ICON,
  NEXT_PUBLIC_HOST_METADATA_KEYWORDS,
} from "@sps/shared-utils";
import { Metadata } from "next/types";

interface Params {
  url: string;
  catchErrors?: boolean;
}

export async function action({ url, catchErrors = false }: Params) {
  const metadata = {
    title: NEXT_PUBLIC_HOST_METADATA_TITLE || "",
    description: NEXT_PUBLIC_HOST_METADATA_DESCRIPTION || "",
    openGraph: {
      title: NEXT_PUBLIC_HOST_METADATA_TITLE || "",
      description: NEXT_PUBLIC_HOST_METADATA_DESCRIPTION || "",
      type: "website",
      url: HOST_URL || "",
      image: NEXT_PUBLIC_HOST_METADATA_ICON || "",
    },
    twitter: {
      title: NEXT_PUBLIC_HOST_METADATA_TITLE || "",
      description: NEXT_PUBLIC_HOST_METADATA_DESCRIPTION || "",
      image: NEXT_PUBLIC_HOST_METADATA_ICON || "",
    },
    keywords: NEXT_PUBLIC_HOST_METADATA_KEYWORDS.split(",") || [],
    url: HOST_URL || "",
    image: NEXT_PUBLIC_HOST_METADATA_ICON || "",
    icons: NEXT_PUBLIC_HOST_METADATA_ICON
      ? [{ url: NEXT_PUBLIC_HOST_METADATA_ICON }]
      : [],
  } as Metadata;

  try {
    const metadataEntites = await api.find();
    const primaryMetadata = metadataEntites?.find(
      (item) => item.variant === "primary",
    );

    const image = NEXT_PUBLIC_HOST_METADATA_ICON;
    const icons: Metadata["icons"] = [];

    // if (primaryMetadata?.metadataToSpsFileStorageModuleFiles?.length) {
    //   for (const metadataToSpsFileStorageModuleFile of primaryMetadata.metadataToSpsFileStorageModuleFiles) {
    //     const file = await fileStorageFileapi.findById({
    //       id: metadataToSpsFileStorageModuleFile.fileStorageModuleFileId,
    //     });

    //     const fileUrl = `${BACKEND_URL}${file.file}`;

    //     if (metadataToSpsFileStorageModuleFile.type === "icon") {
    //       icons.push({
    //         url: fileUrl,
    //       });

    //       continue;
    //     }

    //     image = fileUrl;
    //   }
    // }
    if (primaryMetadata) {
      metadata.title = primaryMetadata.title || metadata.title;
      metadata.description =
        primaryMetadata.description || metadata.description;

      if (metadata.openGraph) {
        metadata.openGraph.title =
          primaryMetadata.title || metadata.openGraph.title;
        metadata.openGraph.description =
          primaryMetadata.description || metadata.openGraph.description;
        metadata.openGraph.images = image;
      }

      if (metadata.twitter) {
        metadata.twitter.title =
          primaryMetadata.title || metadata.twitter.title;
        metadata.twitter.description =
          primaryMetadata.description || metadata.twitter.description;
        metadata.twitter.images = image;
      }

      metadata.keywords =
        primaryMetadata.keywords?.split(",") || metadata.keywords;
    }
  } catch (error) {
    if (!catchErrors) {
      throw error;
    }
  }

  return metadata;
}
