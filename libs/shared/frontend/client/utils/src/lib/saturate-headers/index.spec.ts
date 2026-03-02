import { util as saturateHeaders } from "./index";
import * as clientUtils from "../index";

describe("saturate-headers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("merges explicit headers with authorization headers", () => {
    jest.spyOn(clientUtils.authorization, "headers").mockReturnValue({
      Authorization: "Bearer token",
    });

    expect(
      saturateHeaders({
        "Content-Type": "application/json",
      }),
    ).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
  });

  it("returns explicit headers when authorization is empty", () => {
    jest.spyOn(clientUtils.authorization, "headers").mockReturnValue({});

    expect(
      saturateHeaders({
        "X-Request-Id": "req-1",
      }),
    ).toEqual({
      "X-Request-Id": "req-1",
    });
  });
});
