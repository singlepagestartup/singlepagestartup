/**
 * BDD Suite: host revalidation route access.
 *
 * Given: the API asks the host to drop cached pages and reads after a write,
 *        on the route anyone can reach.
 * When: a request arrives with the shared credential in the
 *       X-HOST-REVALIDATION-SECRET header, a wrong one, none, or at a host
 *       that has no credential configured.
 * Then: only the configured HOST_SERVICE_REVALIDATION_SECRET revalidates
 *       anything, every refusal is the same 401, and a host without the secret
 *       refuses every caller and names the missing variable in its log.
 */

const CONFIGURED_SECRET =
  "4f9d2c7a1e0b8356c4a7e2d9f1b3085c6e2a9d4f7b1c3e5a8d0f2b4c6e8a1d3f";

let mockConfiguredSecret: string | undefined = CONFIGURED_SECRET;

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  get HOST_SERVICE_REVALIDATION_SECRET() {
    return mockConfiguredSecret;
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { GET } from "./route";

function createRequest(query: string, credential?: string) {
  const headers = new Headers();

  if (credential !== undefined) {
    headers.set("X-HOST-REVALIDATION-SECRET", credential);
  }

  return new NextRequest(`http://localhost:3000/api/revalidate?${query}`, {
    headers,
  });
}

beforeEach(() => {
  mockConfiguredSecret = CONFIGURED_SECRET;
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("host revalidation route", () => {
  /**
   * BDD Scenario
   *
   * Given: a host with the secret configured.
   * When: a request asks for the root layout without the credential header.
   * Then: it is refused with 401 and no cache entry is revalidated.
   */
  it("refuses a request that carries no credential", async () => {
    const response = await GET(createRequest("path=/&type=layout"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: a host with the secret configured.
   * When: the header carries a value of the same length that differs in one byte.
   * Then: it is refused with the same 401, and the host writes nothing to its
   *       log for a caller it does not know.
   */
  it("refuses a credential of the same length that differs in one byte", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const nearMiss = `${CONFIGURED_SECRET.slice(0, -1)}0`;

    expect(nearMiss).toHaveLength(CONFIGURED_SECRET.length);

    const response = await GET(createRequest("path=/&type=layout", nearMiss));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: a host with the secret configured.
   * When: the header carries a shorter, a longer or an empty value.
   * Then: each is refused with 401 instead of failing the length-sensitive
   *       comparison with an exception.
   */
  it.each([
    ["a shorter value", "short"],
    ["a longer value", `${CONFIGURED_SECRET}-and-more`],
    ["an empty value", ""],
  ])("refuses %s without throwing", async (_label, credential) => {
    const response = await GET(
      createRequest("tag=/api/blog/articles", credential),
    );

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: the revalidation middleware encodes a tag that contains reserved
   *        query characters.
   * When: the request carries the configured credential.
   * Then: exactly that tag is revalidated, and the characters do not turn
   *       into a second parameter.
   */
  it("revalidates exactly the encoded tag for the configured credential", async () => {
    const tag = "/api/blog/articles/a&path=/&type=layout";

    const response = await GET(
      createRequest(`tag=${encodeURIComponent(tag)}`, CONFIGURED_SECRET),
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith(tag);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect((await response.json()).revalidated).toEqual({ tag, path: null });
  });

  /**
   * BDD Scenario
   *
   * Given: the API seed revalidates the root layout on every API start.
   * When: its request carries the configured credential.
   * Then: the root layout is revalidated.
   */
  it("revalidates the root layout for the seed's request", async () => {
    const response = await GET(
      createRequest("path=/&type=layout", CONFIGURED_SECRET),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  /**
   * BDD Scenario
   *
   * Given: the agent page cache revalidates one page before it warms it.
   * When: its request carries the configured credential and the encoded page.
   * Then: that page is revalidated with the page type.
   */
  it("revalidates one page for the agent page cache's request", async () => {
    const page = "http://localhost:3000/ru/gallery/item";

    const response = await GET(
      createRequest(
        `path=${encodeURIComponent(page)}&type=page`,
        CONFIGURED_SECRET,
      ),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith(page, "page");
  });
});

describe("host revalidation route without a configured secret", () => {
  /**
   * BDD Scenario
   *
   * Given: a deployment that upgraded without setting the secret on the host.
   * When: requests arrive with a credential and without one.
   * Then: both are refused with 401, nothing is revalidated, and each call
   *       writes a warning that names the variable and never a submitted value.
   */
  it("refuses every caller and names the missing variable in the log", async () => {
    mockConfiguredSecret = undefined;
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const withCredential = await GET(
      createRequest("path=/&type=layout", CONFIGURED_SECRET),
    );
    const withoutCredential = await GET(
      createRequest("tag=/api/blog/articles"),
    );

    expect(withCredential.status).toBe(401);
    expect(withoutCredential.status).toBe(401);
    expect(await withCredential.json()).toEqual({ error: "Unauthorized" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toContain("HOST_SERVICE_REVALIDATION_SECRET");
    expect(JSON.stringify(warn.mock.calls)).not.toContain(CONFIGURED_SECRET);
  });

  /**
   * BDD Scenario
   *
   * Given: a host whose secret is set to the empty string.
   * When: a request presents the same empty value.
   * Then: it is refused, so an empty secret opens nothing.
   */
  it("treats an empty configured secret as unset", async () => {
    mockConfiguredSecret = "";
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const response = await GET(createRequest("path=/&type=layout", ""));

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
