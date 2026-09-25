/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: wallet login identity lookup credentials.
 *
 * Given: a signed-in browser whose session JWT names a subject, rendering the
 *        Ethereum login component.
 * When: the component checks whether that subject already has an identity.
 * Then: the lookup carries the browser's session headers, so it does not
 *       depend on a cookie the API would have to read.
 */

import { render, waitFor } from "@testing-library/react";
import { Component } from "./ClientComponent";

const findSubjectsToIdentitiesMock = jest.fn();
const sessionHeaders = { Authorization: "Bearer session-jwt" };
const mockDecodedJwt = { decodedToken: { subject: { id: "subject-id" } } };

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    authenticationEthereumVirtualMachine: () => ({
      status: "idle",
      isError: false,
      mutate: jest.fn(),
    }),
    authenticationLogout: () => ({ mutate: jest.fn() }),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => findSubjectsToIdentitiesMock(...args),
  },
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
  saturateHeaders: () => sessionHeaders,
}));

jest.mock("@sps/shared-frontend-client-web3", () => ({
  ethereumVirtualMachine: {
    ConnectWalletButton: () => null,
    wagmiConfig: {},
  },
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: (props: { children?: unknown }) => (
    <button>{props.children as any}</button>
  ),
  Form: (props: { children?: unknown }) => <>{props.children as any}</>,
}));

jest.mock("react-cookie", () => ({
  useCookies: () => [{ "rbac.subject.jwt": "session-jwt" }],
}));

jest.mock("react-jwt", () => ({
  useJwt: () => mockDecodedJwt,
}));

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
}));

jest.mock("@wagmi/core", () => ({
  disconnect: jest.fn(),
  signMessage: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));

describe("Given: the Ethereum login component renders for a signed-in subject", () => {
  beforeEach(() => {
    findSubjectsToIdentitiesMock.mockReset();
    findSubjectsToIdentitiesMock.mockResolvedValue([{ id: "relation-id" }]);
  });

  /**
   * BDD Scenario: the identity lookup authenticates with the header.
   *
   * Given: the session JWT decodes to a subject id.
   * When: the component looks up that subject's identities.
   * Then: the lookup filters by the subject id and sends the session headers.
   */
  it("sends the session headers with the identity lookup", async () => {
    render(
      <Component
        {...({
          isServer: false,
          variant: "authentication-ethereum-virtual-machine-default",
        } as any)}
      />,
    );

    await waitFor(() => {
      expect(findSubjectsToIdentitiesMock).toHaveBeenCalledTimes(1);
    });

    const [lookup] = findSubjectsToIdentitiesMock.mock.calls[0];

    expect(lookup.params.filters.and).toEqual([
      { column: "subjectId", method: "eq", value: "subject-id" },
    ]);
    expect(lookup.options.headers).toEqual(sessionHeaders);
  });
});
