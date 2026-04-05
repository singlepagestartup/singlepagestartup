import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import crossFetch, {
  Headers as CrossFetchHeaders,
  Request as CrossFetchRequest,
  Response as CrossFetchResponse,
} from "cross-fetch";
import { TextDecoder, TextEncoder } from "util";

dotenv.config({
  path: path.resolve(process.cwd(), "apps/api/.env"),
});

dotenv.config({
  path: path.resolve(process.cwd(), "apps/host/.env.local"),
});

if (!process.env.NEXT_PUBLIC_API_SERVICE_URL && process.env.API_SERVICE_URL) {
  process.env.NEXT_PUBLIC_API_SERVICE_URL = process.env.API_SERVICE_URL;
}

if (!global.TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  (global as any).TextDecoder = TextDecoder;
}

if (!global.fetch) {
  (global as any).fetch = crossFetch;
}

if (!global.Headers) {
  (global as any).Headers = CrossFetchHeaders;
}

if (!global.Request) {
  (global as any).Request = CrossFetchRequest;
}

if (!global.Response) {
  (global as any).Response = CrossFetchResponse;
}
