/** @jest-environment jsdom */
import { useEffect } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Client from "./client";

let resolveSegment: (() => void) | undefined;
const readSegment = jest.fn<Promise<string | null>, [string]>();
jest.mock("client-only", () => ({}));
jest.mock("./Skeleton", () => ({
  Skeleton: () => <span role="status">Loading route</span>,
}));
jest.mock("@sps/host/models/page/sdk/client", () => ({
  api: {
    urlSegmentValue: ({ segment }: { segment: string }) =>
      useQuery({
        queryKey: [segment],
        queryFn: () => readSegment(segment),
      }),
  },
}));

afterEach(() => {
  readSegment.mockReset();
  resolveSegment = undefined;
});

it.each(["profile-id", null])(
  "keeps nested account navigation mounted while a resolved segment (%s) refreshes",
  async (profileId) => {
    const mounted = jest.fn();
    function AccountNavigation() {
      useEffect(() => {
        mounted();
      }, []);
      return <input aria-label="Account menu filter" defaultValue="" />;
    }
    readSegment.mockImplementation(async (segment) =>
      segment === "profile" ? profileId : "chat-id",
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <Client
          isServer={false}
          variant="url-segment-value"
          url="/chat"
          segment="profile"
        >
          {() => (
            <Client
              isServer={false}
              variant="url-segment-value"
              url="/chat"
              segment="chat"
            >
              {() => <AccountNavigation />}
            </Client>
          )}
        </Client>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    const menu = await screen.findByRole("textbox", {
      name: "Account menu filter",
    });
    fireEvent.change(menu, { target: { value: "Unsent menu filter" } });
    menu.focus();
    readSegment.mockImplementation((segment) =>
      segment === "profile"
        ? new Promise((resolve) => {
            resolveSegment = () => resolve(profileId);
          })
        : Promise.resolve("chat-id"),
    );
    let refresh: Promise<void>;
    act(() => {
      refresh = client.invalidateQueries({ queryKey: ["profile"] });
    });
    await waitFor(() => expect(resolveSegment).toBeDefined());
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Account menu filter" })).toBe(
      menu,
    );
    expect((menu as HTMLInputElement).value).toBe("Unsent menu filter");
    expect(document.activeElement).toBe(menu);
    await act(async () => {
      resolveSegment!();
      await refresh!;
    });
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Account menu filter" })).toBe(
      menu,
    );
    view.unmount();
    client.clear();
  },
);
