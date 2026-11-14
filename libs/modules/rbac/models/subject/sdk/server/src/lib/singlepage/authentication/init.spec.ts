import { action } from "./init";

it("forwards the visitor bearer so repeated initialization reuses the Subject", async () => {
  const fetchRequest = jest.spyOn(global, "fetch").mockResolvedValue(
    Response.json({
      data: { jwt: "access-token", refresh: "refresh-token" },
    }),
  );
  try {
    await action({
      host: "https://api.example.com",
      options: { headers: new Headers({ Authorization: "Bearer visitor" }) },
    });
    const headers = new Headers(fetchRequest.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer visitor");
    expect(headers.get("Cache-Control")).toBe("no-store");
  } finally {
    fetchRequest.mockRestore();
  }
});
