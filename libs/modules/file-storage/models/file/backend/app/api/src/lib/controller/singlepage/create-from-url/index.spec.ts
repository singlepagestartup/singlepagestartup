/**
 * BDD Suite: file-storage create-from-url download target.
 *
 * Given: the create-from-url handler with storage, file inspection, DNS
 *        answers and the network stubbed, and the deployment's service URLs
 *        set to their internal names.
 * When: a caller submits a URL to download.
 * Then: a URL on a loopback, private or link-local address, or with another
 *       scheme, is refused with 400 before any request; a public URL and a
 *       URL on the host service origin are downloaded and stored.
 */

const mockUploadFile = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  API_SERVICE_URL: "http://api:4000",
  NEXT_PUBLIC_API_SERVICE_URL: "https://api.example.com",
  HOST_SERVICE_URL: "http://host:3000",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.com",
  OUTBOUND_URL_ALLOWED_ORIGINS: "",
  FILE_STORAGE_PROVIDER: "local",
  FILE_STORAGE_FOLDER: "file-storage/test",
}));

jest.mock("@sps/providers-file-storage", () => ({
  Provider: jest.fn().mockImplementation(() => ({
    uploadFile: (...args: unknown[]) => mockUploadFile(...args),
  })),
}));

jest.mock("file-type", () => ({
  fileTypeFromBuffer: jest
    .fn()
    .mockResolvedValue({ ext: "png", mime: "image/png" }),
}));

jest.mock("image-size", () => ({
  imageSize: jest.fn().mockReturnValue({ width: 64, height: 32 }),
}));

jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { lookup } from "node:dns/promises";
import { Handler } from "./index";

const PUBLIC_ADDRESS = "93.184.215.14";

const mockLookup = lookup as unknown as jest.Mock;
const originalFetch = globalThis.fetch;
let mockFetch: jest.Mock;

function createService() {
  return {
    create: jest.fn(async (props: { data: Record<string, unknown> }) => ({
      id: "file-1",
      ...props.data,
    })),
  };
}

function createContext(data: Record<string, unknown>) {
  return {
    req: {
      parseBody: jest.fn().mockResolvedValue({ data: JSON.stringify(data) }),
    },
    json: jest.fn((body: unknown, status: number) => ({ body, status })),
  };
}

async function submit(url: string) {
  const service = createService();
  const context = createContext({ url, adminTitle: "Cat" });
  const result = new Handler(service as any).execute(context as any, jest.fn());

  return { service, context, result };
}

beforeEach(() => {
  mockLookup.mockReset();
  mockUploadFile.mockReset();
  mockUploadFile.mockResolvedValue("/file-storage/test/stored.png");
  mockFetch = jest.fn();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Given: a caller submits a URL that the API must not download", () => {
  /**
   * BDD Scenario: URLs that reach the API host, the metadata service or the
   * disk.
   *
   * Given: a loopback URL, the cloud metadata address, or a file URL.
   * When: the caller submits it.
   * Then: the handler answers 400 and sends no request, stores no file and
   *       creates no row.
   */
  it.each([
    ["a loopback address", "http://127.0.0.1:4000/api/rbac/subjects"],
    ["the cloud metadata address", "http://169.254.169.254/latest/meta-data/"],
    ["a file URL", "file:///etc/hostname"],
  ])("refuses %s with 400", async (_target, url) => {
    const { service, result } = await submit(url);

    await expect(result).rejects.toMatchObject({ status: 400 });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an internal service name.
   *
   * Given: a URL whose host name resolves to an overlay-network address.
   * When: the caller submits it.
   * Then: the handler answers 400 and sends no request.
   */
  it("refuses a name that resolves to a private address", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.2.15", family: 4 }]);

    const { result } = await submit("http://portainer:9000/api/status");

    await expect(result).rejects.toMatchObject({ status: 400 });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("Given: a caller submits a URL that the API may download", () => {
  /**
   * BDD Scenario: a public image, as MCP content management sends it.
   *
   * Given: an https image URL whose host resolves to a public address.
   * When: the caller submits it.
   * Then: the image is downloaded by name, stored under its file name, and a
   *       row with its size, type and dimensions is created with 201.
   */
  it("stores a public image", async () => {
    mockLookup.mockResolvedValue([{ address: PUBLIC_ADDRESS, family: 4 }]);
    mockFetch.mockResolvedValue(
      new Response(new Uint8Array(128), {
        headers: { "content-type": "image/png" },
      }),
    );

    const { service, result } = await submit(
      "https://images.example.com/photos/cat.png?width=500",
    );

    await expect(result).resolves.toMatchObject({ status: 201 });
    expect(String(mockFetch.mock.calls[0][0])).toBe(
      "https://images.example.com/photos/cat.png?width=500",
    );
    expect(mockUploadFile.mock.calls[0][0].file.name).toBe("cat.png");
    expect(service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        file: "/file-storage/test/stored.png",
        size: 128,
        extension: "png",
        mimeType: "image/png",
        width: 64,
        height: 32,
      }),
    });
  });

  /**
   * BDD Scenario: the image generated by the host app.
   *
   * Given: a URL on HOST_SERVICE_URL (http://host:3000), as the generate
   *        route builds it.
   * When: the caller submits it.
   * Then: the image is downloaded from that origin without a DNS check and
   *       stored with 201.
   */
  it("downloads the generated image from the host service origin", async () => {
    const url =
      "http://host:3000/api/image-generator/image.png?variant=default&width=500&height=500&data=eJw";
    mockFetch.mockResolvedValue(new Response(new Uint8Array(64)));

    const { result } = await submit(url);

    await expect(result).resolves.toMatchObject({ status: 201 });
    expect(String(mockFetch.mock.calls[0][0])).toBe(url);
    expect(mockLookup).not.toHaveBeenCalled();
    expect(mockUploadFile.mock.calls[0][0].file.name).toBe("image.png");
  });
});
