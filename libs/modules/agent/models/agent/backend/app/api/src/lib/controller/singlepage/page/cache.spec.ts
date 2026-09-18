/**
 * BDD Suite: agent host page-cache string URL handling.
 *
 * Given: the Host page service returns root and nested URL records as strings.
 * When: the Agent page-cache handler processes every configured language.
 * Then: it revalidates and fetches canonical localized paths without stopping after a page failure.
 */

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES: 3,
  HOST_SERVICE_URL: "http://localhost:3000/",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/agent/models/agent/sdk/model", () => ({
  runIdHeader: "X-SPS-AGENT-RUN-ID",
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

import {
  Handler,
  PAGE_CACHE_SUPERSEDE_CHECK_INTERVAL_IN_MILLISECONDS,
} from "./cache";

const originalFetch = globalThis.fetch;

function createContext(props?: { runId?: string }) {
  return {
    json: jest.fn((payload: unknown) => payload),
    req: {
      header: jest.fn(() => props?.runId),
      path: "/api/agent/agents/host-module-page-cache",
    },
  } as any;
}

function createHandler(props?: { isRunSuperseded?: jest.Mock }) {
  return new Handler({
    agentRun: {
      isRunSuperseded: props?.isRunSuperseded || jest.fn(),
    },
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
   * BDD Scenario: a superseded run stops before the URL list ends.
   *
   * Given: a dispatched run whose slug is already owned by a later run.
   * When: the page-cache handler reaches the next URL after the check interval.
   * Then: it stops and reports the reason instead of warming the rest of the site.
   */
  it("Then: stops warming pages once its run was superseded", async () => {
    const isRunSuperseded = jest.fn().mockResolvedValue(true);
    const handler = createHandler({ isRunSuperseded });
    jest.spyOn(handler, "revalidatePage").mockResolvedValue(undefined);
    const fetchPage = jest.fn().mockResolvedValue({
      ok: true,
    });
    globalThis.fetch = fetchPage as any;
    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValue(PAGE_CACHE_SUPERSEDE_CHECK_INTERVAL_IN_MILLISECONDS);

    const result = await handler.execute(
      createContext({ runId: "run-id" }),
      jest.fn(),
    );

    expect(isRunSuperseded).toHaveBeenCalledWith({
      slug: "host-module-page-cache",
      runId: "run-id",
    });
    expect(fetchPage).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: {
        ok: false,
        stopped: "superseded",
      },
    });
  });

  /**
   * BDD Scenario: repeated page failures end the run.
   *
   * Given: every page fetch fails and the configured failure bound is three.
   * When: the page-cache handler processes the URL list.
   * Then: it stops after the third consecutive failure and reports the reason.
   */
  it("Then: stops after the configured number of consecutive failures", async () => {
    const handler = createHandler();
    jest.spyOn(handler, "revalidatePage").mockResolvedValue(undefined);
    const fetchPage = jest.fn().mockResolvedValue({
      ok: false,
    });
    globalThis.fetch = fetchPage as any;

    const result = await handler.execute(createContext(), jest.fn());

    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      data: {
        ok: false,
        stopped: "failures",
      },
    });
  });
});
