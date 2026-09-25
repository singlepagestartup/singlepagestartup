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

    // text/html is deliberate here: the body is the email document that the
    // notification service hands to the mail transport as `html`.
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    // The route is unauthenticated, so decode and render internals stay in the
    // host log instead of travelling back to the caller.
    console.error("Email generator render failed:", error);

    return NextResponse.json(
      {
        error: "Not Found",
      },
      { status: 404 },
    );
  }
};
