import { util as headers } from "./headers";

describe("authorization headers", () => {
  afterEach(() => {
    delete (global as any).document;
  });

  it("extracts jwt and secret key from cookies", () => {
    Object.defineProperty(global, "document", {
      value: {
        cookie:
          "foo=bar; rbac.subject.jwt=test-jwt-token; rbac.secret-key=test-secret",
      },
      configurable: true,
    });

    expect(headers()).toEqual({
      Authorization: "Bearer test-jwt-token",
      "X-RBAC-SECRET-KEY": "test-secret",
    });
  });

  it("returns empty object when cookies do not contain auth keys", () => {
    Object.defineProperty(global, "document", {
      value: {
        cookie: "foo=bar; hello=world",
      },
      configurable: true,
    });

    expect(headers()).toEqual({});
  });
});
