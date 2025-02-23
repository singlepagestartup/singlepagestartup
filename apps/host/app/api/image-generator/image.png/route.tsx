import { HOST_SERVICE_URL } from "@sps/shared-utils";
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import QueryString from "qs";
import { createElement } from "react";
import { Component as ChildComponent } from "./component";
import pako from "pako";
import { logger } from "@sps/backend-utils";

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

    if (!HOST_SERVICE_URL) {
      throw new Error("Host URL not found");
    }

    const width = parsedParams?.["width"] ? Number(parsedParams["width"]) : 512;
    const height = parsedParams?.["height"]
      ? Number(parsedParams["height"])
      : 512;

    let data;

    if (typeof parsedParams.data === "string") {
      const decodedBuffer = Buffer.from(parsedParams.data, "base64");

      const uint8Array = new Uint8Array(decodedBuffer);

      const inflatedData = pako.inflate(uint8Array, { to: "string" });

      data = JSON.parse(inflatedData);
    }

    const fonts: {
      name: string;
      data: Buffer | ArrayBuffer;
      style: "normal" | "italic";
      weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    }[] = [];

    for (const fontType of Object.keys(fontsURLs)) {
      for (const fontStyle of fontsURLs[fontType as keyof typeof fontsURLs]) {
        const fontData = await fetch(new URL(fontStyle.url, HOST_SERVICE_URL))
          .then((res) => {
            return res.arrayBuffer();
          })
          .catch((error) => {
            logger.error("fetch font ~ error:", error);
          });

        if (!fontData) {
          continue;
        }

        fonts.push({
          name: fontType,
          data: fontData,
          style: fontStyle.style,
          weight: fontStyle.weight,
        });
      }
    }

    return new ImageResponse(
      createElement(Component, { ...parsedParams, data } as any),
      {
        width,
        height,
        fonts,
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 404 },
    );
  }
};
