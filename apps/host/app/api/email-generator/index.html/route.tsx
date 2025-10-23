import { HOST_SERVICE_URL } from "@sps/shared-utils";
import { NextRequest, NextResponse } from "next/server";
import QueryString from "qs";
import { Component } from "./component";
import { Html, render } from "@react-email/components";
import pako from "pako";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const params = searchParams.toString();
    const parsedParams = QueryString.parse(params);

    if (!HOST_SERVICE_URL) {
      throw new Error("Configuration error. Host URL not found");
    }

    let data;

    if (typeof parsedParams.data === "string") {
      const decodedBuffer = Buffer.from(parsedParams.data, "base64");

      const uint8Array = new Uint8Array(decodedBuffer);

      const inflatedData = pako.inflate(uint8Array, { to: "string" });

      data = JSON.parse(inflatedData);
    }

    const html = await render(
      <Html
        lang={
          parsedParams?.lang && typeof parsedParams.lang === "string"
            ? parsedParams.lang
            : "en"
        }
      >
        {parsedParams.variant && typeof parsedParams.variant === "string" ? (
          <Component
            variant={parsedParams.variant as any}
            {...(parsedParams as any)}
            data={data}
          />
        ) : null}
      </Html>,
      {
        pretty: true,
      },
    );

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 404 },
    );
  }
};
