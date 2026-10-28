/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { Component as Byline } from "./index";
import { Component as Author } from "../../../../../../../../relations/profiles-to-blog-module-articles/frontend/component/src/lib/singlepage/author-default";
const mockRead = jest.fn((_props: any) => ({
  data: undefined,
  isLoading: true,
}));
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "byline-test" }));
jest.mock("@sps/social/models/profile/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { findById: (props: any) => mockRead(props) },
}));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { findById: async () => null },
}));
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/client",
  () => ({
    Provider: ({ children }: any) => <>{children}</>,
    api: { findById: (props: any) => mockRead(props) },
  }),
);
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/server",
  () => ({ api: { findById: async () => null } }),
);
jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: () => null,
  BylineSkeleton: jest.requireActual("./Skeleton").Skeleton,
}));
jest.mock("@sps/shared-ui-shadcn", () => ({ TipTap: () => null }));
it.each(["xs", "sm"] as const)(
  "the real shared client readers show one %s byline skeleton for both Profile and author association loading",
  (size) => {
    const { container, unmount } = render(
      <Byline
        isServer={false}
        variant="byline"
        data={{ id: "profile-a" } as any}
        language="en"
        size={size}
      />,
    );
    expect(
      container.querySelectorAll('[data-variant="byline-loading"]'),
    ).toHaveLength(1);
    expect(container.querySelector('[data-variant="byline"]')).toBeNull();
    unmount();
    const association = render(
      <Author
        isServer={false}
        variant="author-default"
        data={{ id: "author-link" } as any}
        language="en"
        size={size}
      />,
    );
    expect(
      association.container.querySelectorAll('[data-variant="byline-loading"]'),
    ).toHaveLength(1);
    expect(
      association.container.querySelector('[data-variant="author-default"]'),
    ).toBeNull();
  },
);
