/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component as V2Form } from "./Component";
import { Component as LegacyForm } from "../../admin/form/Component";

const create = jest.fn();
const update = jest.fn();
const remove = jest.fn();
const profileId = "f7dbba43-06b2-4d76-ae41-7a114313a042";
const articleId = "008edc3b-2962-45ae-b51a-7ac79ef18c41";

jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/client",
  () => ({
    api: {
      create: () => ({ mutate: create }),
      update: () => ({ mutate: update }),
      delete: () => ({ mutate: remove }),
    },
  }),
);
jest.mock("@sps/shared-ui-shadcn", () => {
  const Container = ({ children }: any) => <div>{children}</div>;
  return {
    AlertDialog: Container,
    AlertDialogContent: Container,
    AlertDialogHeader: Container,
    AlertDialogTitle: Container,
    AlertDialogDescription: Container,
    AlertDialogFooter: Container,
    AlertDialogTrigger: ({ children }: any) => children,
    AlertDialogCancel: ({ children }: any) => (
      <button type="button">{children}</button>
    ),
    AlertDialogAction: ({ children, onClick }: any) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Button: ({ children, variant, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  };
});
jest.mock("@sps/shared-frontend-client-hooks", () => ({
  useGetAdminFormState: () => ({ status: "idle" }),
}));
jest.mock("@sps/ui-adapter", () => ({
  FormField: ({ form, name, type }: any) => (
    <input
      aria-label={name}
      {...form.register(name, { valueAsNumber: type === "number" })}
    />
  ),
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: (props: any) => {
    expect(props.isServer).toBe(false);
    return (
      <input
        aria-label={props.formFieldName}
        {...props.form.register(props.formFieldName)}
      />
    );
  },
}));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: (props: any) => {
    expect(props.isServer).toBe(false);
    return (
      <input
        aria-label={props.formFieldName}
        {...props.form.register(props.formFieldName)}
      />
    );
  },
}));
jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/form/Component",
  () => ({
    Component: ({ form, onSubmit, children }: any) => (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">Save</button>
      </form>
    ),
  }),
);
jest.mock(
  "@sps/shared-frontend-components/singlepage/admin/form/Component",
  () => ({
    Component: ({ form, onSubmit, children }: any) => (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">Save</button>
      </form>
    ),
  }),
);

describe.each([
  ["admin-form", LegacyForm],
  ["admin-v2-form", V2Form],
] as const)("%s relation form", (variant, FormComponent) => {
  const Form = FormComponent as React.ComponentType<any>;
  beforeEach(() => jest.clearAllMocks());

  it("prefills both parents and creates a link", async () => {
    render(
      <Form
        isServer={false}
        variant={variant as any}
        defaultProfileId={profileId}
        defaultBlogModuleArticleId={articleId}
      />,
    );
    expect((screen.getByLabelText("profileId") as HTMLInputElement).value).toBe(
      profileId,
    );
    expect(
      (screen.getByLabelText("blogModuleArticleId") as HTMLInputElement).value,
    ).toBe(articleId);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          profileId,
          blogModuleArticleId: articleId,
          orderIndex: 0,
          variant: "default",
        }),
      }),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("preserves persisted endpoints over defaults and edits the link", async () => {
    render(
      <Form
        isServer={false}
        variant={variant as any}
        defaultProfileId={articleId}
        defaultBlogModuleArticleId={profileId}
        data={
          {
            id: "relation-1",
            profileId,
            blogModuleArticleId: articleId,
            orderIndex: 2,
            variant: "default",
            className: "p-4",
          } as any
        }
      />,
    );
    expect((screen.getByLabelText("profileId") as HTMLInputElement).value).toBe(
      profileId,
    );
    expect(
      (screen.getByLabelText("blogModuleArticleId") as HTMLInputElement).value,
    ).toBe(articleId);
    fireEvent.change(screen.getByLabelText("orderIndex"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        id: "relation-1",
        data: expect.objectContaining({
          profileId,
          blogModuleArticleId: articleId,
          orderIndex: 5,
        }),
      }),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects submission without both endpoints", async () => {
    render(
      <Form
        isServer={false}
        variant={variant as any}
        defaultProfileId={profileId}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeDefined(),
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("deletes a persisted relation without mutating its endpoints", () => {
    render(
      <Form
        isServer={false}
        variant={variant as any}
        data={
          { id: "relation-1", profileId, blogModuleArticleId: articleId } as any
        }
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith(
      { id: "relation-1" },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
