// Use the installed client, not Bun's partial built-in "undici" shim.
import { Agent, request, type Dispatcher } from "undici/index.js";
import { Readable } from "node:stream";
import { isIP, type LookupFunction } from "node:net";
import type { IOutboundUrlTarget } from "..";

interface IOutboundUrlTransportResult {
  response: Response;
  close: () => Promise<void>;
}

/** A per-hop client keeps DNS pinning, TLS and credentials local to this URL. */
export async function requestOutboundUrl(
  target: IOutboundUrlTarget,
  init: RequestInit,
  signal: AbortSignal,
): Promise<IOutboundUrlTransportResult> {
  let lookup: LookupFunction | undefined;

  if (target.address) {
    const address = target.address;
    const family = isIP(address);
    lookup = (_hostname, options, callback) => {
      if (options.all) {
        callback(null, [{ address, family }]);
        return;
      }

      callback(null, address, family);
    };
  }

  // Native Bun fetch in 1.3.6 invokes checkServerIdentity after sending HTTP.
  // Undici connects through node:tls and verifies TLS before writing the request.
  // A plain Agent also ignores HTTP_PROXY/HTTPS_PROXY and global dispatchers.
  const dispatcher = new Agent({
    connections: 1,
    // One request per dispatcher. Setting zero sends Connection: close, which
    // can leave Bun waiting for peer shutdown before it validates a redirect.
    pipelining: 1,
    maxHeaderSize: 16384,
    connect: { lookup, rejectUnauthorized: true, autoSelectFamily: false },
  });
  const close = async () => {
    await dispatcher.destroy();
  };

  try {
    const headers = new Headers(init.headers);
    headers.set("host", target.url.host);
    headers.set("accept-encoding", "identity");
    headers.delete("proxy-authorization");
    headers.delete("content-length");
    headers.delete("transfer-encoding");

    // Request serializes multipart data without buffering it. Rebuild it for a
    // same-origin redirect so a FormData body can be sent again.
    const serialized = new Request(target.url.href, {
      ...init,
      headers,
      duplex: "half",
    } as RequestInit);
    let body: Readable | undefined;

    if (serialized.body) {
      body = Readable.fromWeb(
        serialized.body as unknown as Parameters<typeof Readable.fromWeb>[0],
      );
    }

    const result = await request(target.url, {
      dispatcher,
      method: serialized.method as Dispatcher.HttpMethod,
      headers: Object.fromEntries(serialized.headers),
      body,
      signal,
    });
    const responseHeaders = new Headers();

    for (const [name, value] of Object.entries(result.headers)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          responseHeaders.append(name, entry);
        }
      } else if (value !== undefined) {
        responseHeaders.set(name, value);
      }
    }

    let responseBody: ReadableStream<Uint8Array> | null = null;

    if (
      serialized.method !== "HEAD" &&
      ![204, 205, 304].includes(result.statusCode)
    ) {
      responseBody = Readable.toWeb(
        result.body,
      ) as unknown as ReadableStream<Uint8Array>;
    } else {
      result.body.destroy();
    }

    return {
      response: new Response(responseBody, {
        status: result.statusCode,
        headers: responseHeaders,
      }),
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
