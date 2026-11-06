jest.mock("@sps/broadcast/models/channel/sdk/server", () => ({ api: {} }));
jest.mock("@sps/broadcast/models/message/sdk/server", () => ({ api: {} }));
jest.mock("@sps/backend-utils", () => ({ logger: { error: jest.fn() } }));

import { Middleware } from "./index";

it("resolves repeated nested observer placeholders using their matched boundaries", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue({ status: 400 } as Response);
  try {
    await new Middleware().executePipeline({
      message: { id: "message-id" } as never,
      index: 0,
      triggerResult: { article: { title: "Framework" } },
      previouseResult: { id: "previous-id" },
      pipe: [
        {
          method: "POST",
          url: "https://api.example.test/next",
          headers: {},
          body: {
            data: {
              title:
                "[triggerResult.article.title] / [triggerResult.article.title]",
              previous: "[previouseResult.id]",
            },
          },
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(JSON.parse(body.get("data") as string)).toEqual({
      title: "Framework / Framework",
      previous: "previous-id",
    });
  } finally {
    fetchMock.mockRestore();
  }
});
