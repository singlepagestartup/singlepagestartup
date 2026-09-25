/**
 * BDD Suite: wallet login response.
 *
 * Given: the Ethereum login handler mounted on a Hono app, with the service
 *        stubbed to accept a signature and issue a token pair.
 * When: a browser submits a signed message.
 * Then: the token pair comes back in the body and no session cookie is
 *       written.
 */

import { Hono } from "hono";
import { Handler } from "./ethereum-virtual-machine";

function createWalletLoginRoute() {
  const service = {
    authenticationEthereumVirtualMachine: jest.fn().mockResolvedValue({
      jwt: "session-jwt",
      refresh: "refresh-jwt",
    }),
  };
  const handler = new Handler(service as any);
  const hono = new Hono();

  hono.post("/ethereum-virtual-machine", (c, next) => handler.execute(c, next));

  return { hono, service };
}

describe("Given: a browser signs in with a wallet", () => {
  /**
   * BDD Scenario: the pair travels in the body only.
   *
   * Given: a request with a signed message in its form data.
   * When: the handler answers.
   * Then: it returns 201 with the token pair and sets no cookie.
   */
  it("answers with the token pair and writes no session cookie", async () => {
    const { hono, service } = createWalletLoginRoute();
    const signed = {
      message: "1790000000000",
      signature: "0xsignature",
      address: "0xaddress",
    };
    const body = new FormData();

    body.set("data", JSON.stringify(signed));

    const response = await hono.request("/ethereum-virtual-machine", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: { jwt: "session-jwt", refresh: "refresh-jwt" },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(service.authenticationEthereumVirtualMachine).toHaveBeenCalledWith({
      data: signed,
    });
  });
});
