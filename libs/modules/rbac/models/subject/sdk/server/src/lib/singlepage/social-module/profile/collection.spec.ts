import { action as find } from "./find";
import { action as create } from "./create";
import { action as update } from "./find-by-id/update";

describe("Subject profile REST SDK", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as any;
  });
  it("find uses the collection with profile filters", async () => {
    await find({
      id: "subject-1",
      host: "http://api.test",
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: "artificial-intelligence",
            },
          ],
        },
      },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles?filters[and][0][column]=variant&filters[and][0][method]=eq&filters[and][0][value]=artificial-intelligence",
      expect.objectContaining({ method: "GET" }),
    );
  });
  it("create posts only the project title and variant to the collection", async () => {
    const data = {
      variant: "artificial-intelligence" as const,
      title: { en: "Project" },
    };
    await create({ id: "subject-1", host: "http://api.test", data });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(
      (global.fetch as jest.Mock).mock.calls[0][1].body.get("data"),
    ).toEqual(JSON.stringify(data));
  });
  it.each([
    { Authorization: "Bearer owner" },
    [["Authorization", "Bearer owner"]],
    new Headers({ Authorization: "Bearer owner" }),
  ])(
    "preserves scoped update authentication for supported header representations %j",
    async (headers) => {
      await update({
        id: "owner",
        socialModuleProfileId: "profile",
        data: { title: { en: "New title" } },
        options: { headers: headers as any },
      });
      const options = (global.fetch as jest.Mock).mock.calls[0][1];
      const sent = new Headers(options.headers);
      expect(sent.get("Authorization")).toBe("Bearer owner");
      expect(sent.get("content-type")).toBe("application/json");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({
        data: { title: { en: "New title" } },
      });
    },
  );
});
