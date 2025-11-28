import { HTTPException } from "hono/http-exception";
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
      errorJson = await props.res.json();
    } catch {
      // Not JSON
    }

    if (errorJson?.data) {
      errorMessages.push(errorJson.data);
    }

    if (errorJson?.cause) {
      if (Array.isArray(errorJson.cause)) {
        causes = errorJson.cause.map((e) => ({
          message: e.message,
          stack: isDebug ? e.stack.replace(/\n/g, "\\n") : undefined,
        }));
        errorMessages.push(...errorJson.cause.map((e) => e.message));
      } else {
        causes.push({
          message: errorJson.cause,
          stack: isDebug ? errorJson.stack.replace(/\n/g, "\\n") : undefined,
        });
        errorMessages.push(errorJson.cause);
      }
    }

    const currentErrorMessage = `${props.res.status} | ${props.res.statusText}`;
    causes.push({
      message: currentErrorMessage,
      stack: isDebug ? new Error().stack?.replace(/\n/g, "\\n") : undefined,
    });
    errorMessages.push(currentErrorMessage);

    const errorPayload = {
      message: errorMessages.join(" | "),
      status: props.res.status,
      cause: causes,
    };

    if (props.catchErrors) {
      console.error("❌ API Error:", JSON.stringify(errorPayload, null, 2));
      return undefined;
    }

    if (isServer) {
      throw new HTTPException(props.res.status as ContentfulStatusCode, {
        message: JSON.stringify(errorPayload),
      });
    } else {
      throw new Error(JSON.stringify(errorPayload));
    }
  }

  return (await props.res.json()) as T;
}

export { util };
