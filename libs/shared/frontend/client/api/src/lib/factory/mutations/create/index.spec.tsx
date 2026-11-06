/** @jest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { Toaster } from "@sps/ui-adapter/toast";
import { Headers, Response } from "cross-fetch";
import { mutation } from "./index";

describe("API errors shown by a Host mutation", () => {
  const fetchMock = jest.fn();
  beforeAll(() => {
    Object.assign(globalThis, { fetch: fetchMock, Headers });
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  afterEach(() => fetchMock.mockReset());

  it.each([
    [400, "Validation error. Select files to attach."],
    [401, "Authentication error. Invalid credentials"],
    [402, "Payment error. Insufficient balance"],
    [403, "Permission error. Administrator role required"],
    [404, "Not Found error. Message not found"],
    [409, "Conflict error. Receipt expired"],
    [422, "Unprocessable Entity error. Invalid field value"],
    [500, "Configuration error. Provider unavailable"],
  ] as const)(
    "shows the API message and error icon for %i",
    async (status, message) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ status, error: message }), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
      render(<Toaster />);
      const create = mutation({ host: "http://api.test", route: "/messages" });
      await act(async () => {
        await expect(create({ data: {} })).rejects.toMatchObject({
          status,
          message,
        });
      });
      const title = await screen.findByText(message);
      expect(
        title
          .closest("[data-sonner-toast]")
          ?.querySelector('[data-toast-icon="error"]'),
      ).toBeTruthy();
    },
  );
});
