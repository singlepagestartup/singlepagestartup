import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import QueryString from "qs";
import { createElement } from "react";
import { Component as ChildComponent } from "./component";
import pako from "pako";
import fs from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";

const fontsURLs: {
  [key in "Default" | "Primary"]: {
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    style: "normal" | "italic";
    url: URL;
  }[];
} = {
  Default: [
    {
      weight: 100,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Thin.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 100,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/ThinItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 200,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/ExtraLight.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 200,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/ExtraLightItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 300,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Light.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 300,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/LightItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 400,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Regular.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 400,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/RegularItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 500,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Medium.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 500,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/MediumItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 600,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/SemiBold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 600,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/SemiBoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 700,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Bold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 700,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/BoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 800,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/ExtraBold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 800,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/ExtraBoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 900,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Default/Black.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 900,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Default/BlackItalic.ttf",
        import.meta.url,
      ),
    },
  ],
  Primary: [
    {
      weight: 100,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Thin.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 100,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/ThinItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 200,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/ExtraLight.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 200,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/ExtraLightItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 300,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Light.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 300,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/LightItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 400,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Regular.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 400,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/RegularItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 500,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Medium.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 500,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/MediumItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 600,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/SemiBold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 600,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/SemiBoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 700,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Bold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 700,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/BoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 800,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/ExtraBold.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 800,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/ExtraBoldItalic.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 900,
      style: "normal",
      url: new URL(
        "../../../../styles/fonts/Primary/Black.ttf",
        import.meta.url,
      ),
    },
    {
      weight: 900,
      style: "italic",
      url: new URL(
        "../../../../styles/fonts/Primary/BlackItalic.ttf",
        import.meta.url,
      ),
    },
  ],
};

function Component(props: any) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <ChildComponent {...props} />
    </div>
  );
}

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const params = searchParams.toString();
    const parsedParams = QueryString.parse(params);

    const width = parsedParams?.["width"] ? Number(parsedParams["width"]) : 512;
    const height = parsedParams?.["height"]
      ? Number(parsedParams["height"])
      : 512;

    let data: Record<string, any> = {};

    if (typeof parsedParams.data === "string") {
      const decodedBuffer = Buffer.from(parsedParams.data, "base64");

      const uint8Array = new Uint8Array(decodedBuffer);

      const inflatedData = pako.inflate(uint8Array, { to: "string" });

      data = JSON.parse(inflatedData);
    }

    let backgroundImage: string | undefined;

    if (
      parsedParams.variant ===
        "generate-template-ecommerce-order-receipt-default" ||
      parsedParams.variant ===
        "generate-template-ecommerce-product-attachment-default"
    ) {
      const templateId = data.fileStorage?.file?.id;

      if (
        typeof templateId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          templateId,
        )
      ) {
        throw new Error("Invalid image template identifier");
      }

      // Resolve the saved template through its public SDK. Never fetch a URL
      // from the render payload or add operator credentials to this public route.
      const template = await fileStorageFileApi.findById({
        id: templateId,
        options: { cache: "no-store", signal: AbortSignal.timeout(10000) },
      });

      if (
        !template ||
        template.variant !== parsedParams.variant ||
        (template.size !== null && template.size > 5 * 1024 * 1024)
      ) {
        throw new Error("Image template is unavailable or too large");
      }

      const blob = await fileStorageFileApi.content({
        id: template.id,
        signal: AbortSignal.timeout(10000),
      });

      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("Image template is too large");
      }

      const bytes = Buffer.from(await blob.arrayBuffer());
      const type = await fileTypeFromBuffer(bytes);

      if (
        !type ||
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
          "image/avif",
        ].includes(type.mime)
      ) {
        throw new Error("Image template must contain a raster image");
      }

      backgroundImage = `data:${type.mime};base64,${bytes.toString("base64")}`;
    } else if (
      parsedParams.variant === "generate-template-opengraph-image-default"
    ) {
      const bytes = await fs.readFile(
        path.join(process.cwd(), "public/images/favicon.svg"),
      );
      backgroundImage = `data:image/svg+xml;base64,${bytes.toString("base64")}`;
    }

    const fonts: {
      name: string;
      data: Buffer | ArrayBuffer;
      style: "normal" | "italic";
      weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    }[] = [];

    for (const fontType of Object.keys(fontsURLs)) {
      for (const fontStyle of fontsURLs[fontType as keyof typeof fontsURLs]) {
        let fontData: Buffer;

        // Webpack's relative-URL runtime exposes /_next/static/media/... with
        // an empty protocol. Resolve that public asset path in the build first.
        const staticMediaPath = fontStyle.url.pathname.split(
          "/_next/static/media/",
        )[1];
        if (staticMediaPath) {
          fontData = await fs.readFile(
            path.join(
              process.cwd(),
              process.env.SPS_HOST_DIST_DIR || ".next",
              "static",
              "media",
              path.basename(decodeURIComponent(staticMediaPath)),
            ),
          );
        } else if (fontStyle.url.protocol === "file:") {
          // Turbopack emits a file URL pointing directly at the bundled font.
          fontData = await fs.readFile(fontStyle.url);
        } else {
          const response = await fetch(fontStyle.url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`Failed to load font: ${response.status}`);
          }
          fontData = Buffer.from(await response.arrayBuffer());
        }

        fonts.push({
          name: fontType,
          data: fontData,
          style: fontStyle.style,
          weight: fontStyle.weight,
        });
      }
    }

    // ImageResponse sets the image content type itself; nosniff keeps a
    // rasterised body from being re-interpreted as a document.
    return new ImageResponse(
      createElement(Component, {
        ...parsedParams,
        data,
        backgroundImage,
      } as any),
      {
        width,
        height,
        fonts,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error: any) {
    // The route is unauthenticated, so decode and render internals stay in the
    // host log instead of travelling back to the caller.
    console.error("Image generator render failed:", error);

    return NextResponse.json(
      {
        error: "Not Found error. Template unavailable",
      },
      { status: 404 },
    );
  }
};
