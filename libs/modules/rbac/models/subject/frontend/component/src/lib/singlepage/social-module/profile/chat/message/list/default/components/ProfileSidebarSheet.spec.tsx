/** @jest-environment jsdom */
import { useRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import { ProfileSidebarSheet } from "./ProfileSidebarSheet";

function ChatProfile({
  explicitEditorFocus = false,
}: {
  explicitEditorFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const summary = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <button ref={trigger} onClick={() => setOpen(true)}>
        Alice
      </button>
      <ProfileSidebarSheet
        isOpen={open}
        onOpenChange={setOpen}
        language="en"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <h2 tabIndex={-1} ref={summary}>
          Alice’s details
        </h2>
        <button onClick={() => setEditing(true)}>Edit Alice</button>
      </ProfileSidebarSheet>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent
          onCloseAutoFocus={
            explicitEditorFocus
              ? (event) => {
                  event.preventDefault();
                  summary.current?.focus();
                }
              : undefined
          }
        >
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Profile details for Alice</DialogDescription>
          <input aria-label="Name" defaultValue="Alice" />
        </DialogContent>
      </Dialog>
    </>
  );
}

it("keeps the profile open underneath an editor and restores keyboard focus when the profile closes", async () => {
  render(<ChatProfile />);
  const trigger = screen.getByRole("button", { name: "Alice" });
  trigger.focus();
  fireEvent.click(trigger);
  const profile = screen.getByRole("dialog", { name: "Profile details" });
  const edit = screen.getByRole("button", { name: "Edit Alice" });
  edit.focus();
  fireEvent.click(edit);
  const editor = screen.getByRole("dialog", { name: "Edit profile" });
  fireEvent.keyDown(editor, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Edit profile" })).toBeNull(),
  );
  expect(screen.getByRole("dialog", { name: "Profile details" })).toBe(profile);
  await waitFor(() => expect(document.activeElement).toBe(edit));
  fireEvent.keyDown(profile, { key: "Escape" });
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("honors an explicit focus target when closing a nested editor", async () => {
  render(<ChatProfile explicitEditorFocus />);
  fireEvent.click(screen.getByRole("button", { name: "Alice" }));
  const edit = screen.getByRole("button", { name: "Edit Alice" });
  edit.focus();
  fireEvent.click(edit);
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Edit profile" }), {
    key: "Escape",
  });
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Alice’s details" }),
    ),
  );
});

it("returns from a declarative media preview to its gallery thumbnail", async () => {
  render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Gallery</DialogTitle>
        <DialogDescription>Conversation media</DialogDescription>
        <button type="button">Filters</button>
        <Dialog>
          <DialogTrigger>Preview portrait</DialogTrigger>
          <DialogContent>
            <DialogTitle>Portrait</DialogTitle>
            <DialogDescription>Image preview</DialogDescription>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>,
  );
  const thumbnail = screen.getByRole("button", { name: "Preview portrait" });
  screen.getByRole("button", { name: "Filters" }).focus();
  fireEvent.click(thumbnail);
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Portrait" }), {
    key: "Escape",
  });
  await waitFor(() => expect(document.activeElement).toBe(thumbnail));
});
