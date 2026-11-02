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
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import Client from "./client";

const readPage = jest.fn<Promise<Partial<IResolvedPage>>, [string]>();
jest.mock("client-only", () => ({}));
jest.mock("./Skeleton", () => ({
  Skeleton: () => <span role="status">Loading route</span>,
}));
jest.mock("@sps/host/models/page/sdk/client", () => ({
  api: {
    findByUrl: ({ url }: { url: string }) =>
      useQuery({
        queryKey: ["page", url],
        queryFn: () => readPage(url),
        staleTime: Infinity,
      }),
  },
}));
afterEach(() => readPage.mockReset());

it.each([{ "social.chats.id": "chat", "social.threads.id": "thread" }, {}])(
  "shares one URL read and preserves nested UI during refetch: %j",
  async (routeParams) => {
    const mounted = jest.fn();
    function Draft() {
      useEffect(() => {
        mounted();
      }, []);
      return <input aria-label="Message" />;
    }
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    readPage.mockResolvedValue({ routeParams });
    const view = render(
      <QueryClientProvider client={client}>
        <Client isServer={false} variant="url-segment-values" url="/project">
          {({ data }) => (
            <>
              <output>{JSON.stringify(data)}</output>
              <Draft />
            </>
          )}
        </Client>
        <Client isServer={false} variant="url-segment-values" url="/project">
          {({ data }) => <output>{JSON.stringify(data)}</output>}
        </Client>
      </QueryClientProvider>,
    );
    const draft = await screen.findByRole("textbox", { name: "Message" });
    expect(readPage).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(JSON.stringify(routeParams))).toHaveLength(2);
    fireEvent.change(draft, { target: { value: "Unsent draft" } });
    draft.focus();
    let resolvePage: ((page: Partial<IResolvedPage>) => void) | undefined;
    readPage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    let refresh: Promise<void>;
    act(() => {
      refresh = client.invalidateQueries({ queryKey: ["page", "/project"] });
    });
    await waitFor(() => expect(resolvePage).toBeDefined());
    expect(screen.queryByText("Loading route")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Message" })).toBe(draft);
    expect((draft as HTMLInputElement).value).toBe("Unsent draft");
    expect(document.activeElement).toBe(draft);
    await act(async () => {
      resolvePage!({ routeParams });
      await refresh!;
    });
    expect(mounted).toHaveBeenCalledTimes(1);
    view.unmount();
    client.clear();
  },
);
