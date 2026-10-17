/** @jest-environment jsdom */
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

const readPage = jest.fn();
jest.mock("client-only", () => ({}));
jest.mock("./Skeleton", () => ({
  Skeleton: () => <span role="status">Loading page</span>,
}));
jest.mock("@sps/host/models/page/sdk/client", () => ({
  api: {
    findByUrl: ({ url }: { url: string }) =>
      useQuery({
        queryKey: [url],
        queryFn: () => readPage(),
      }),
  },
}));

it("keeps page content mounted through a background refresh and renders the new result", async () => {
  readPage.mockResolvedValue({ id: "page", title: "Before" });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <Client isServer={false} variant="find-by-url" url="/chat">
        {({ data }) => (
          <section>
            <p>{data?.title}</p>
            <input aria-label="Draft" />
          </section>
        )}
      </Client>
    </QueryClientProvider>,
  );
  expect(screen.getByRole("status")).toBeTruthy();
  const draft = await screen.findByRole("textbox", { name: "Draft" });
  fireEvent.change(draft, { target: { value: "Keep this draft" } });
  draft.focus();
  let resolvePage: ((value: unknown) => void) | undefined;
  readPage.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolvePage = resolve;
      }),
  );
  let refresh: Promise<void>;
  act(() => {
    refresh = client.invalidateQueries({ queryKey: ["/chat"] });
  });
  await waitFor(() => expect(resolvePage).toBeDefined());
  expect(screen.getByText("Before")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
  await act(async () => {
    resolvePage!({ id: "page", title: "After" });
    await refresh!;
  });
  expect(await screen.findByText("After")).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
  expect((draft as HTMLInputElement).value).toBe("Keep this draft");
  expect(document.activeElement).toBe(draft);
  view.unmount();
  client.clear();
});
