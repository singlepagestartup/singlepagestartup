const projectsFind = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { socialModuleProfileProjects: (props: any) => projectsFind(props) },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({ "client-only": "header" }),
}));
import { findProjects } from "./utils";

beforeEach(() => projectsFind.mockReset());
it("uses the authenticated aggregate and retains its selected first document", async () => {
  const project = {
    profile: { id: "assistant" },
    chat: { id: "chat" },
    thread: { id: "brief" },
    requesterProfileId: "personal",
  };
  projectsFind.mockResolvedValue([project]);
  const options = {
    headers: { Authorization: "Bearer current-subject-token" },
    cache: "no-store" as const,
  };
  expect(
    await findProjects({
      subjectId: "subject",
      profiles: [{ id: "assistant" } as any],
      host: "http://internal-api",
      options,
    }),
  ).toEqual([project]);
  expect(projectsFind).toHaveBeenCalledWith({
    id: "subject",
    host: "http://internal-api",
    options,
  });
});
it("does not expose a profile outside the subject collection", async () => {
  projectsFind.mockResolvedValue([{ profile: { id: "foreign" } }]);
  expect(
    await findProjects({
      subjectId: "subject",
      profiles: [{ id: "assistant" } as any],
    }),
  ).toEqual([]);
});
it("skips the aggregate when the subject has no profiles", async () => {
  expect(await findProjects({ subjectId: "subject", profiles: [] })).toEqual(
    [],
  );
  expect(projectsFind).not.toHaveBeenCalled();
});
it("returns no project when the aggregate contains no linked requester membership", async () => {
  projectsFind.mockResolvedValue([]);
  expect(
    await findProjects({
      subjectId: "subject",
      profiles: [{ id: "assistant" } as any],
    }),
  ).toEqual([]);
});
