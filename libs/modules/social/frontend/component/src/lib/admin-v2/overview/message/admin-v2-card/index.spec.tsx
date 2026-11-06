/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social message card of the admin-v2 overview.
 *
 * Given: the host renders the admin-v2 overview on the server, and counting
 * messages requires the Admin role.
 * When: the overview renders the message card.
 * Then: the card counts in the browser, where the request carries the admin's
 * token, and never through the server SDK, which sends no credential.
 */

import { render, screen } from "@testing-library/react";
import { api as clientApi } from "@sps/social/models/message/sdk/client";
import { api as serverApi } from "@sps/social/models/message/sdk/server";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import { Component } from ".";

describe("Given: the message card of the admin-v2 overview", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: the host renders the card with isServer set, as it renders the whole overview.
   * When: the card loads its count.
   * Then: the browser SDK answers it and the card shows it, while the server SDK is never asked.
   */
  it("When: the overview renders on the server Then: the card counts through the browser SDK", () => {
    const clientCount = jest
      .spyOn(clientApi, "count")
      .mockReturnValue({ data: 7 } as any);
    const serverCount = jest.spyOn(serverApi, "count");

    render(<Component isServer={true} variant="admin-v2-card" />);

    expect(screen.getByText("7")).toBeTruthy();
    expect(clientCount).toHaveBeenCalled();
    expect(serverCount).not.toHaveBeenCalled();
  });
});
