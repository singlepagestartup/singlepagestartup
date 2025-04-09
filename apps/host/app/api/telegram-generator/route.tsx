import { HOST_SERVICE_URL } from "@sps/shared-utils";
import { NextRequest, NextResponse } from "next/server";
import QueryString from "qs";
import { response } from "./response";
import pako from "pako";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const params = searchParams.toString();
    const parsedParams = QueryString.parse(params);

    if (!HOST_SERVICE_URL) {
      throw new Error("Host URL not found");
    }

    let data;

    if (typeof parsedParams.data === "string") {
      const decodedBuffer = Buffer.from(parsedParams.data, "base64");

      const uint8Array = new Uint8Array(decodedBuffer);

      const inflatedData = pako.inflate(uint8Array, { to: "string" });

      data = JSON.parse(inflatedData);
    }

    return new NextResponse(
      JSON.stringify(
        response({
          variant: parsedParams.variant as any,
          data,
          language: (parsedParams.language as string) || "en",
        }),
      ),
      {
        headers: {
          "Content-Type": "text/html",
        },
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
