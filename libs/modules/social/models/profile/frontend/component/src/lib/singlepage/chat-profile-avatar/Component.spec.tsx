/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social profile chat avatar.
 *
 * Given: a social profile can have linked file-storage files.
 * When: the chat renders profile avatars.
 * Then: the latest linked image is used before falling back to initials.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

let profileFiles: any[] = [];
let files: any[] = [];
let profileRelationApiProps: any;
let fileApiProps: any;

jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: {
      apiProps: unknown;
      children: (props: { data: any[] }) => React.ReactNode;
    }) => {
      profileRelationApiProps = props.apiProps;

      return <>{props.children({ data: profileFiles })}</>;
    },
  }),
);

jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: (props: {
    apiProps: unknown;
    children: (props: { data: any[] }) => React.ReactNode;
  }) => {
    fileApiProps = props.apiProps;

    return <>{props.children({ data: files })}</>;
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    alt: string;
    className?: string;
    fill?: boolean;
    sizes?: string;
    src: string;
  }) => {
    return (
      <img
        alt={props.alt}
        className={props.className}
        data-fill={props.fill ? "true" : "false"}
        data-testid="profile-avatar-image"
        sizes={props.sizes}
        src={props.src}
      />
    );
  },
}));

describe("GIVEN: social profile chat avatar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    profileFiles = [];
    files = [];
    profileRelationApiProps = undefined;
    fileApiProps = undefined;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  /**
   * BDD Scenario: latest linked image file is used.
   *
   * Given: a profile has an image file through profiles-to-files relation.
   * When: the chat avatar renders the profile.
   * Then: it queries the latest relation and renders the linked image.
   */
  test("When: profile has a linked image Then: latest relation image is rendered", () => {
    profileFiles = [
      {
        id: "profile-file-1",
        fileStorageModuleFileId: "file-1",
      },
    ];
    files = [
      {
        id: "file-1",
        file: "/avatars/maxim.png",
        extension: "png",
        mimeType: "image/png",
      },
    ];

    act(() => {
      root.render(
        <Component
          className="h-10 w-10"
          isServer={false}
          variant="chat-profile-avatar"
          language="en"
          data={
            {
              id: "profile-1",
              slug: "ai-maxim",
              adminTitle: "AI Maksim Ivanov",
              title: {},
            } as any
          }
        />,
      );
    });

    const image = container.querySelector(
      "[data-testid='profile-avatar-image']",
    ) as HTMLImageElement | null;

    expect(profileRelationApiProps.params.filters.and).toEqual([
      {
        column: "profileId",
        method: "eq",
        value: "profile-1",
      },
    ]);
    expect(profileRelationApiProps.params.orderBy.and).toEqual([
      {
        column: "orderIndex",
        method: "desc",
      },
      {
        column: "updatedAt",
        method: "desc",
      },
      {
        column: "createdAt",
        method: "desc",
      },
    ]);
    expect(profileRelationApiProps.params.limit).toBe(1);
    expect(fileApiProps.params.filters.and).toEqual([
      {
        column: "id",
        method: "eq",
        value: "file-1",
      },
    ]);
    expect(fileApiProps.params.limit).toBe(1);
    expect(image?.getAttribute("alt")).toBe("AI Maksim Ivanov");
    expect(image?.getAttribute("src")).toContain("/public/avatars/maxim.png");
  });

  /**
   * BDD Scenario: non-image or missing image falls back to initial.
   *
   * Given: a profile has no usable linked image.
   * When: the chat avatar renders the profile.
   * Then: it renders the profile title initial.
   */
  test("When: profile has no usable image Then: title initial is rendered", () => {
    profileFiles = [
      {
        id: "profile-file-1",
        fileStorageModuleFileId: "file-1",
      },
    ];
    files = [
      {
        id: "file-1",
        file: "/documents/profile.pdf",
        extension: "pdf",
        mimeType: "application/pdf",
      },
    ];

    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-avatar"
          language="en"
          data={
            {
              id: "profile-1",
              slug: "ai-maxim",
              adminTitle: "AI Maksim Ivanov",
              title: {},
            } as any
          }
        />,
      );
    });

    expect(
      container.querySelector("[data-testid='profile-avatar-image']"),
    ).toBeNull();
    expect(container.textContent).toBe("A");
  });
});
