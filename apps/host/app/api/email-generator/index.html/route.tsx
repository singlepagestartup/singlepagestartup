import { NextRequest, NextResponse } from "next/server";
import { rbacSecretMatches } from "@sps/backend-utils";
import { renderRequestSchema } from "@sps/notification/models/template/sdk/model";
import { Component } from "./component";
import { variants } from "./component/variants";
import { Html, render } from "react-email";

export const POST = async (request: NextRequest) => {
  if (!rbacSecretMatches(request.headers.get("X-RBAC-SECRET-KEY"))) {
    return NextResponse.json(
      { error: "Permission error. Operator credential required" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const props = renderRequestSchema.parse(body);
    if (!Object.hasOwn(variants, props.variant)) {
      throw new Error("Not Found error. Template variant not found");
    }
    const html = await render(
      <Html lang={props.language ?? "en"}>
        <Component {...(props as any)} />
      </Html>,
    );
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Email generator render failed:", error);
    return NextResponse.json(
      { error: "Not Found error. Template unavailable" },
      { status: 404 },
    );
  }
};
