import { ContentfulStatusCode } from "hono/utils/http-status";

const isServer = typeof window === "undefined";
const isDebug =
  process.env.NODE_ENV === "development" || process.env.DEBUG === "true";

async function util<T>(props: {
  res: Response;
  catchErrors?: boolean;
}): Promise<T | undefined> {
  if (!props.res.ok) {
    let errorJson;
    let errorMessages: string[] = [];
    let causes: { message: string; stack?: string }[] = [];

    try {
      // Clone response before reading to avoid "body already used" error
      const clonedRes = props.res.clone();
      errorJson = await clonedRes.json();
    } catch {
      // Not JSON
    }

    const primaryMessage =
      errorJson?.error ||
      errorJson?.message ||
      errorJson?.data ||
      (Array.isArray(errorJson?.cause)
        ? errorJson.cause[0]?.message
        : errorJson?.cause);

    if (primaryMessage) {
      errorMessages.push(primaryMessage);
    }

    if (errorJson?.cause) {
      if (Array.isArray(errorJson.cause)) {
        causes = errorJson.cause.map((e) => ({
          message: e.message,
          stack: isDebug ? e.stack?.replace(/\n/g, "\\n") : undefined,
        }));
      } else {
        causes.push({
          message: errorJson.cause,
          stack: isDebug ? errorJson?.stack?.replace(/\n/g, "\\n") : undefined,
        });
      }
    }

    if (!primaryMessage) {
      const currentErrorMessage = `${props.res.status} | ${props.res.statusText}`;
      causes.push({
        message: currentErrorMessage,
        stack: isDebug ? new Error().stack?.replace(/\n/g, "\\n") : undefined,
      });
      errorMessages.push(currentErrorMessage);
    }

    const errorPayload = {
      message: errorMessages[0] || "Unknown error",
      status: props.res.status,
      cause: causes,
    };

    if (props.catchErrors) {
      console.error("❌ API Error:", JSON.stringify(errorPayload, null, 2));
      return undefined;
    }

    if (isServer) {
      // Dynamic import to avoid bundling Hono on client
      const { HTTPException } = await import("hono/http-exception");

      throw new HTTPException(props.res.status as ContentfulStatusCode, {
        message: JSON.stringify(errorPayload),
        cause: errorPayload,
      });
    } else {
      throw new Error(JSON.stringify(errorPayload));
    }
  }

  try {
    return (await props.res.json()) as T;
  } catch (error) {
    // Handle JSON parse errors or empty responses
    console.error("Failed to parse response JSON:", error);
    if (props.catchErrors) {
      return undefined;
    }
    throw error;
  }
}

export { util };
