/**
 * BDD Suite: agent host page-cache string URL handling.
 *
 * Given: the Host page service returns root and nested URL records as strings.
 * When: the Agent page-cache handler processes every configured language.
 * Then: it revalidates and fetches canonical localized paths without stopping after a page failure,
 *       and each revalidation carries the host revalidation secret.
 */

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  HOST_SERVICE_REVALIDATION_SECRET: "test-host-revalidation-secret",
  HOST_SERVICE_REVALIDATION_SECRET_HEADER:
    jest.requireActual("@sps/shared-utils")
      .HOST_SERVICE_REVALIDATION_SECRET_HEADER,
  HOST_SERVICE_URL: "http://localhost:3000/",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [
      {
        title: "English",
        code: "en",
      },
      {
        title: "Russian",
        code: "ru",
      },
    ],
    defaultLanguage: {
      title: "English",
      code: "en",
    },
  },
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    details: error,
    message: error.message,
    status: 500,
  }),
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}));

import { HOST_SERVICE_REVALIDATION_SECRET_HEADER } from "@sps/shared-utils";
import { Handler } from "./cache";

const originalFetch = globalThis.fetch;

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createHandler() {
  return new Handler({
    hostModule: {
      page: {
        urls: jest.fn().mockResolvedValue([
          {
            url: "/",
          },
          {
            url: "/gallery/item",
          },
        ]),
      },
    },
  } as any);
}

describe("Given: Host page URLs use the documented string contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: root and nested strings expand across languages.
   *
   * Given: root and nested URL strings plus English and Russian languages.
   * When: the page-cache handler completes successfully.
   * Then: every localized path is revalidated before it is fetched with exact separators.
   */
  it("Then: revalidates and fetches canonical default and localized paths", async () => {
    const handler = createHandler();
    const revalidatePage = jest
      .spyOn(handler, "revalidatePage")
      .mockResolvedValue(undefined);
    const fetchPage = jest.fn().mockResolvedValue({
      ok: true,
    });
    globalThis.fetch = fetchPage as any;
    const context = createContext();
    const expectedPaths = [
      "http://localhost:3000/",
      "http://localhost:3000/ru/",
      "http://localhost:3000/gallery/item",
      "http://localhost:3000/ru/gallery/item",
    ];

    const result = await handler.execute(context, jest.fn());

    expect(revalidatePage.mock.calls.map(([path]) => path)).toEqual(
      expectedPaths,
    );
    expect(fetchPage.mock.calls).toEqual(
      expectedPaths.map((path) => [
        path,
        {
          method: "GET",
        },
      ]),
    );
    for (const index of expectedPaths.keys()) {
      expect(revalidatePage.mock.invocationCallOrder[index]).toBeLessThan(
        fetchPage.mock.invocationCallOrder[index],
      );
    }
    expect(context.json).toHaveBeenCalledWith({
      data: {
        ok: true,
      },
    });
    expect(result).toEqual({
      data: {
        ok: true,
      },
    });
  });

  /**
   * BDD Scenario: a page failure does not stop later URLs.
   *
   * Given: the first page fetch fails and later localized pages can succeed.
   * When: the page-cache handler processes the complete URL list.
   * Then: it logs the failed page and still reaches every later revalidation and fetch.
   */
  it("Then: continues after a failed page and completes later URLs", async () => {
    const handler = createHandler();
    const revalidatePage = jest
      .spyOn(handler, "revalidatePage")
      .mockResolvedValue(undefined);
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValue({
        ok: true,
      });
    globalThis.fetch = fetchPage as any;
    const context = createContext();
    const expectedPaths = [
      "http://localhost:3000/",
      "http://localhost:3000/ru/",
      "http://localhost:3000/gallery/item",
      "http://localhost:3000/ru/gallery/item",
    ];

    const result = await handler.execute(context, jest.fn());

    expect(revalidatePage.mock.calls.map(([path]) => path)).toEqual(
      expectedPaths,
    );
    expect(fetchPage.mock.calls.map(([path]) => path)).toEqual(expectedPaths);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "http://localhost:3000/ - Failed to fetch page",
      {
        page: "http://localhost:3000/",
        error: expect.any(Error),
      },
    );
    expect(result).toEqual({
      data: {
        ok: true,
      },
    });
  });

  /**
   * BDD Scenario: a page revalidation carries the host secret.
   *
   * Given: a localized page URL.
   * When: the handler asks the host to revalidate that page.
   * Then: the request carries the revalidation secret, the encoded URL as its only path value, and the page type.
   */
  it("Then: asks the host to revalidate the page with the revalidation secret", async () => {
    const handler = createHandler();
    const fetchHost = jest.fn().mockResolvedValue({
      ok: true,
    });
    globalThis.fetch = fetchHost as any;
    const page = "http://localhost:3000/ru/gallery/item?view=grid&page=2";

    await handler.revalidatePage(page);

    expect(fetchHost).toHaveBeenCalledTimes(1);

    const [url, init] = fetchHost.mock.calls[0];
    const requested = new URL(url);

    expect(requested.pathname).toMatch(/\/api\/revalidate$/);
    expect(requested.searchParams.getAll("path")).toEqual([page]);
    expect(requested.searchParams.get("type")).toBe("page");
    expect(init.headers).toEqual({
      [HOST_SERVICE_REVALIDATION_SECRET_HEADER]:
        "test-host-revalidation-secret",
    });
    expect(mockLoggerError).not.toHaveBeenCalled();
  });
});
