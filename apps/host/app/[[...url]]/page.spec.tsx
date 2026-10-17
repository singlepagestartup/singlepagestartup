/**
 * BDD Suite: catch-all route generation.
 *
 * Given: Host page masks can expand across all user-owned entities.
 * When: Next asks for static paths or renders a path not in a static manifest.
 * Then: it skips global enumeration and resolves the requested URL on demand.
 */
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import Page, { dynamicParams, generateStaticParams } from "./page";

jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { urls: jest.fn(async () => [{ url: ["en", "ai-chat", "projects"] }]) },
}));
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
  api: { generate: jest.fn() },
}));
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("../../src/components/admin", () => ({ Component: () => null }));
jest.mock("../../src/components/admin-v2", () => ({ Component: () => null }));

describe("catch-all route generation", () => {
  it.each(["phase-development-server", "phase-production-build"])(
    "does not enumerate entity paths during %s",
    async (phase) => {
      const previousPhase = process.env.NEXT_PHASE;
      process.env.NEXT_PHASE = phase;
      try {
        expect(await generateStaticParams()).toEqual([]);
        expect(pageApi.urls).not.toHaveBeenCalled();
      } finally {
        if (previousPhase === undefined) delete process.env.NEXT_PHASE;
        else process.env.NEXT_PHASE = previousPhase;
      }
    },
  );

  it("resolves an unlisted project URL through the normal page reader", async () => {
    expect(dynamicParams).toBe(true);
    const element = await Page({
      params: Promise.resolve({
        url: ["en", "ai-chat", "social", "profiles", "new-profile"],
      }),
    });

    expect(element.props).toMatchObject({
      isServer: true,
      variant: "find-by-url",
      url: "/ai-chat/social/profiles/new-profile",
      silentNotFound: true,
    });
  });
});
