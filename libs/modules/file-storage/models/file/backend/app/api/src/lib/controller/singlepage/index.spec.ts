/**
 * BDD Suite: file upload routes.
 *
 * Given: the file model app composed with its real controller, a recording
 *        service, a storage provider double, FILE_STORAGE_MAX_UPLOAD_BYTES
 *        configured and DNS answering fetched hosts with a public address.
 * When: uploads arrive on the create, update and create-from-url routes.
 * Then: one file per request is stored, several files are refused with 400
 *       and bodies over the limit with 413, and a refused request uploads and
 *       writes nothing.
 */

let mockMaxUploadBytes = 4096;
const mockUploadFile = jest.fn();
const mockDeleteFile = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    get FILE_STORAGE_MAX_UPLOAD_BYTES() {
      return mockMaxUploadBytes;
    },
  };
});

jest.mock("@sps/providers-file-storage", () => {
  return {
    Provider: jest.fn().mockImplementation(() => {
      return { uploadFile: mockUploadFile, deleteFile: mockDeleteFile };
    }),
  };
});

jest.mock("file-type", () => {
  return { fileTypeFromBuffer: jest.fn(async () => undefined) };
});

jest.mock("node:dns/promises", () => {
  return {
    lookup: jest.fn(async () => [{ address: "93.184.215.14", family: 4 }]),
  };
});

import { HTTPException } from "hono/http-exception";
import { App } from "../../app";
import { Controller } from ".";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"></svg>';
const uploadedFileUrl = "/file-storage/static/uploaded.svg";

const exceptionFilter = {
  catch: (error: any, c: any) => {
    return error instanceof HTTPException
      ? error.getResponse()
      : c.json({ error: "Internal server error" }, 500);
  },
} as any;

function createService() {
  return {
    create: jest.fn(async (props: { data: Record<string, unknown> }) => {
      return { id: "file-1", ...props.data };
    }),
    update: jest.fn(
      async (props: { id: string; data: Record<string, unknown> }) => {
        return { id: props.id, ...props.data };
      },
    ),
    findById: jest.fn(async () => {
      return { id: "file-1", file: "/file-storage/static/previous.svg" };
    }),
  };
}

async function createApp() {
  const service = createService();
  const app = new App(
    exceptionFilter,
    new Controller(service as any),
    {} as any,
  );

  await app.init();

  return { hono: app.hono, service };
}

function logo(name = "logo.svg") {
  return new File([svg], name, { type: "image/svg+xml" });
}

async function multipart(
  fields: [string, string | File][],
  options: { declareLength: boolean } = { declareLength: true },
) {
  const formData = new FormData();

  fields.forEach(([name, value]) => {
    formData.append(name, value);
  });

  const encoded = new Response(formData);
  const body = await encoded.arrayBuffer();
  const headers: Record<string, string> = {
    "content-type": encoded.headers.get("content-type") ?? "",
  };

  if (options.declareLength) {
    headers["content-length"] = String(body.byteLength);
  }

  return { body, headers };
}

function urlImport(url = "https://files.example.com/logo.svg") {
  return multipart([["data", JSON.stringify({ url, adminTitle: "Logo" })]]);
}

describe("file upload routes", () => {
  let fetchSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    mockMaxUploadBytes = 4096;
    mockUploadFile.mockReset().mockResolvedValue(uploadedFileUrl);
    mockDeleteFile.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    fetchSpy = undefined;
  });

  /**
   * BDD Scenario
   * Given: a create request carrying one SVG file under the field `file`.
   * When: it is posted to the create route.
   * Then: the file is uploaded once and one record is created with its URL and SVG type.
   */
  it("When: one file is uploaded Then: it is stored as one record", async () => {
    const { hono, service } = await createApp();
    const request = await multipart([
      ["data", JSON.stringify({ adminTitle: "Logo" })],
      ["file", logo()],
    ]);

    const response = await hono.request("/", { method: "POST", ...request });

    expect(response.status).toBe(201);
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminTitle: "Logo",
        file: uploadedFileUrl,
        extension: "svg",
        mimeType: "image/svg+xml",
      }),
    });
  });

  /**
   * BDD Scenario
   * Given: a create request carrying two files under different fields.
   * When: it is posted to the create route.
   * Then: it is refused with a 400 validation error and nothing is uploaded or created.
   */
  it("When: two file fields are sent Then: the request is refused and nothing is stored", async () => {
    const { hono, service } = await createApp();
    const request = await multipart([
      ["data", JSON.stringify({ adminTitle: "Logo" })],
      ["file", logo()],
      ["image", logo("second.svg")],
    ]);

    const response = await hono.request("/", { method: "POST", ...request });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Multiple files are not allowed");
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a create request repeating the `file` field with two files.
   * When: it is posted to the create route.
   * Then: it is refused with a 400 validation error instead of keeping one of the files.
   */
  it("When: the file field is repeated Then: the request is refused and nothing is stored", async () => {
    const { hono, service } = await createApp();
    const request = await multipart([
      ["file", logo()],
      ["file", logo("second.svg")],
    ]);

    const response = await hono.request("/", { method: "POST", ...request });

    expect(response.status).toBe(400);
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an update request carrying one replacement file.
   * When: it is sent to the update route of an existing record.
   * Then: the file is uploaded, the record is updated with its URL and the previous file is deleted.
   */
  it("When: one replacement file is uploaded Then: the record is updated", async () => {
    const { hono, service } = await createApp();
    const request = await multipart([["file", logo()]]);

    const response = await hono.request("/file-1", {
      method: "PATCH",
      ...request,
    });

    expect(response.status).toBe(201);
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith({
      id: "file-1",
      data: expect.objectContaining({ file: uploadedFileUrl }),
    });
    expect(mockDeleteFile).toHaveBeenCalledWith({ name: "previous.svg" });
  });

  /**
   * BDD Scenario
   * Given: an update request carrying two files.
   * When: it is sent to the update route.
   * Then: it is refused with a 400 validation error and the record and stored files are untouched.
   */
  it("When: two files are sent to update Then: the request is refused and nothing changes", async () => {
    const { hono, service } = await createApp();
    const request = await multipart([
      ["file", logo()],
      ["image", logo("second.svg")],
    ]);

    const response = await hono.request("/file-1", {
      method: "PATCH",
      ...request,
    });

    expect(response.status).toBe(400);
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a create request whose declared length is over the upload limit.
   * When: it is posted to the create route.
   * Then: it is refused with 413 Payload Too Large and nothing is uploaded or created.
   */
  it("When: a declared upload is over the limit Then: the create route refuses it", async () => {
    mockMaxUploadBytes = 256;
    const { hono, service } = await createApp();
    const request = await multipart([
      ["file", new File(["x".repeat(512)], "large.txt")],
    ]);

    const response = await hono.request("/", { method: "POST", ...request });

    expect(response.status).toBe(413);
    expect(await response.text()).toContain(
      "Payload Too Large error. The upload limit is 256 bytes",
    );
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a create request streamed without a declared length and larger than the limit.
   * When: the create handler reads it.
   * Then: it is refused with 413 Payload Too Large and nothing is uploaded or created.
   */
  it("When: an undeclared upload grows past the limit Then: the create route refuses it", async () => {
    mockMaxUploadBytes = 256;
    const { hono, service } = await createApp();
    const request = await multipart(
      [["file", new File(["x".repeat(512)], "large.txt")]],
      { declareLength: false },
    );

    const response = await hono.request("/", { method: "POST", ...request });

    expect(response.status).toBe(413);
    expect(await response.text()).toContain("Payload Too Large");
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an update request whose declared length is over the upload limit.
   * When: it is sent to the update route.
   * Then: it is refused with 413 Payload Too Large and the record is untouched.
   */
  it("When: a declared upload is over the limit Then: the update route refuses it", async () => {
    mockMaxUploadBytes = 256;
    const { hono, service } = await createApp();
    const request = await multipart([
      ["file", new File(["x".repeat(512)], "large.txt")],
    ]);

    const response = await hono.request("/file-1", {
      method: "PATCH",
      ...request,
    });

    expect(response.status).toBe(413);
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a URL whose response declares a length over the upload limit.
   * When: create-from-url fetches it.
   * Then: it is refused with 413 Payload Too Large and nothing is uploaded or created.
   */
  it("When: a fetched file declares a length over the limit Then: create-from-url refuses it", async () => {
    mockMaxUploadBytes = 256;
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("x".repeat(512), {
        headers: { "content-length": "512" },
      }),
    );
    const { hono, service } = await createApp();

    const response = await hono.request("/create-from-url", {
      method: "POST",
      ...(await urlImport()),
    });

    expect(response.status).toBe(413);
    expect(await response.text()).toContain(
      "Payload Too Large error. The upload limit is 256 bytes",
    );
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a URL whose response streams 2000 bytes in 100-byte chunks without a declared length.
   * When: create-from-url fetches it under a 256-byte limit.
   * Then: it is refused with 413 Payload Too Large and nothing is uploaded or created; where reading
   *       stops is covered by the fetchOutboundUrl spec.
   */
  it("When: a fetched file streams past the limit Then: create-from-url refuses it", async () => {
    mockMaxUploadBytes = 256;
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            for (let chunk = 0; chunk < 20; chunk++) {
              controller.enqueue(new Uint8Array(100));
            }

            controller.close();
          },
        }),
      ),
    );
    const { hono, service } = await createApp();

    const response = await hono.request("/create-from-url", {
      method: "POST",
      ...(await urlImport()),
    });

    expect(response.status).toBe(413);
    expect(await response.text()).toContain(
      "Payload Too Large error. The upload limit is 256 bytes",
    );
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a URL whose response is an SVG within the upload limit.
   * When: create-from-url fetches it.
   * Then: the file is uploaded and one record is created with its size and SVG type.
   */
  it("When: a fetched file is within the limit Then: create-from-url stores it", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(svg));
    const { hono, service } = await createApp();

    const response = await hono.request("/create-from-url", {
      method: "POST",
      ...(await urlImport()),
    });

    expect(response.status).toBe(201);
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        file: uploadedFileUrl,
        size: svg.length,
        extension: "svg",
        mimeType: "image/svg+xml",
      }),
    });
  });
});
