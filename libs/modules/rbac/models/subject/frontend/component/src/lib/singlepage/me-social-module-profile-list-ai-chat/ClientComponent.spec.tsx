/** @jest-environment jsdom */
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockProfilesFind = jest.fn();
const mockContextsFind = jest.fn();
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFind: (props: any) =>
      useQuery({
        queryKey: ["profiles", props.id],
        queryFn: mockProfilesFind,
        initialData: props.reactQueryOptions.initialData,
      }),
    socialModuleProfileProjects: (props: any) =>
      useQuery({
        queryKey: ["projects", props.id],
        queryFn: () => mockContextsFind(props),
        ...props.reactQueryOptions,
      }),
  },
}));
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-ai-chat/utils",
  () => ({
    getProjectsQueryKey: (id: string) => ["projects", id],
    findProjects: (props: any) => mockContextsFind(props),
  }),
);
import Component from "./client";

function example(initialProjects?: any[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Component
        {...({
          isServer: false,
          variant: "me-social-module-profile-list-ai-chat",
          data: { id: "new-subject" },
          initialProjects,
          loading: <p role="status">Loading projects</p>,
          renderProjects: ({ projects }: { projects: any[] }) =>
            projects.length ? (
              <p>{projects[0].profile.id}</p>
            ) : (
              <button>Create project</button>
            ),
        } as any)}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mockProfilesFind.mockResolvedValue([]);
  mockContextsFind.mockResolvedValue([]);
});

it("replaces loading with creation when a new Subject has no profiles", async () => {
  let resolve!: (profiles: any[]) => void;
  mockProfilesFind.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  example();
  expect(screen.getByRole("status").textContent).toBe("Loading projects");
  resolve([]);
  expect(
    await screen.findByRole("button", { name: "Create project" }),
  ).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(mockContextsFind).not.toHaveBeenCalled();
});

it("renders creation immediately for an initial empty collection", () => {
  example([]);
  expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(mockContextsFind).not.toHaveBeenCalled();
});

it("shows a failed profile request instead of the disabled context query's pending state", async () => {
  mockProfilesFind.mockRejectedValue(new Error("Permission error"));
  example();
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("button", { name: "Create project" })).toBeNull();
  expect(mockContextsFind).not.toHaveBeenCalled();
});

it("can retry a failed collection and then show the empty state", async () => {
  mockProfilesFind.mockRejectedValueOnce(new Error("Temporary failure"));
  example();
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("button", { name: "Create project" }),
  ).toBeTruthy();
  await waitFor(() => expect(mockProfilesFind).toHaveBeenCalledTimes(2));
});

it("shows a context failure without presenting an empty project collection", async () => {
  mockProfilesFind.mockResolvedValue([{ id: "Existing project" }]);
  mockContextsFind.mockRejectedValue(new Error("Conversation unavailable"));
  example();
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("button", { name: "Create project" })).toBeNull();
});

it("renders the loaded projects after resolving their contexts", async () => {
  mockProfilesFind.mockResolvedValue([{ id: "Existing project" }]);
  mockContextsFind.mockResolvedValue([{ profile: { id: "Existing project" } }]);
  example();
  expect(await screen.findByText("Existing project")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
});
