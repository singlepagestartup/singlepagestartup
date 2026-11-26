import { action } from "./update";

it("sends cover bytes in multipart and resets the cover without sending a title", async () => {
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () =>
      Response.json({ data: { id: "chat", coverFileId: null } }),
    );
  const params = {
    id: "manager",
    socialModuleChatId: "chat",
    host: "http://local.test",
    options: { headers: { Authorization: "Bearer manager" } },
  };
  try {
    const image = new File(["cover"], "cover.png", { type: "image/png" });
    await action({ ...params, data: { coverFile: image } });
    const [, upload] = fetch.mock.calls[0];
    const form = upload?.body as FormData;
    expect(upload?.method).toBe("PATCH");
    expect(new Headers(upload?.headers).get("authorization")).toBe(
      "Bearer manager",
    );
    expect((form.get("coverFile") as File).name).toBe("cover.png");
    expect(await (form.get("coverFile") as File).text()).toBe("cover");
    expect(form.get("data")).toBe("{}");

    await action({ ...params, data: { removeCover: true } });
    const removal = fetch.mock.calls[1][1]?.body as FormData;
    expect(removal.has("coverFile")).toBe(false);
    expect(JSON.parse(String(removal.get("data")))).toEqual({
      removeCover: true,
    });
  } finally {
    fetch.mockRestore();
  }
});
