import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Command } from "cmdk";
import { Button, Checkbox, Icon, kit, Specimen } from "./primitives";

export default function Overlays() {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [name, setName] = useState("Studio demo");
  const [draftName, setDraftName] = useState(name);
  const [deleted, setDeleted] = useState(false);
  const [compact, setCompact] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [menuResult, setMenuResult] = useState("No action selected.");
  const [commandResult, setCommandResult] = useState("No command selected.");
  const nameId = useId();
  const nameErrorId = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const commandInput = useRef<HTMLInputElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const invalidName = !draftName.trim();
  const overlay = "fixed inset-0 z-50 bg-[var(--workspace-brand-primary)]/35";
  const content =
    "fixed left-1/2 top-1/2 z-[60] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl focus:outline-none";
  const floating =
    "z-[60] max-w-[calc(100vw_-_2rem)] rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-lg";
  const menuItem =
    "flex min-h-11 cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

  return (
    <div className="grid gap-6">
      <Specimen
        id="dialog"
        title="Dialog"
        description="A focused edit with an explicit save or cancel."
        states={["Closed", "Open", "Invalid", "Saved", "Cancelled"]}
        usage="Use a modal for one contained task. Focus moves inside and returns to its trigger; Escape cancels."
        recipe={content}
      >
        <p className={`mb-4 text-sm ${kit.muted}`}>
          Local workspace name:{" "}
          <span className="font-semibold text-[var(--workspace-brand-foreground)]">
            {name}
          </span>
        </p>
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary" onClick={() => setDraftName(name)}>
              <Icon name="pencil-simple" />
              Edit demo name
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content
                className={content}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  nameInput.current?.focus();
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <Dialog.Title className="text-2xl font-semibold">
                    Edit workspace name
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Close name dialog"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                  This changes the name in this preview only.
                </Dialog.Description>
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draftName.trim()) {
                      setName(draftName.trim());
                      setDialogOpen(false);
                    }
                  }}
                >
                  <label className={kit.label} htmlFor={nameId}>
                    Workspace name
                  </label>
                  <input
                    ref={nameInput}
                    id={nameId}
                    className={kit.field}
                    required
                    maxLength={60}
                    value={draftName}
                    aria-invalid={invalidName}
                    aria-describedby={invalidName ? nameErrorId : undefined}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                  {invalidName ? (
                    <p
                      id={nameErrorId}
                      role="alert"
                      className="text-sm text-[var(--workspace-brand-danger)]"
                    >
                      Enter a workspace name.
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button variant="secondary">Cancel</Button>
                    </Dialog.Close>
                    <Button type="submit" disabled={!draftName.trim()}>
                      Save local name
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
      </Specimen>

      <Specimen
        id="confirmation"
        title="Confirmation dialog"
        description="Name the item and consequence before a destructive action."
        states={["Ready", "Confirming", "Cancelled", "Removed", "Restored"]}
        usage="Use an alert dialog only for a consequence that needs explicit consent. Initial focus stays on Cancel."
        recipe={`${content} / ${kit.danger}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--workspace-brand-line)] p-4">
          <p role="status" className="text-sm">
            {deleted
              ? "The demo draft has been removed."
              : "Draft: First project notes"}
          </p>
          {deleted ? (
            <Button
              ref={restoreButton}
              variant="secondary"
              onClick={() => setDeleted(false)}
            >
              Restore demo draft
            </Button>
          ) : (
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <Button variant="danger">
                  <Icon name="trash" />
                  Remove draft
                </Button>
              </AlertDialog.Trigger>
              {portal ? (
                <AlertDialog.Portal container={portal}>
                  <AlertDialog.Overlay className={overlay} />
                  <AlertDialog.Content
                    className={content}
                    onCloseAutoFocus={(event) => {
                      if (restoreButton.current) {
                        event.preventDefault();
                        restoreButton.current.focus();
                      }
                    }}
                  >
                    <AlertDialog.Title className="text-2xl font-semibold">
                      Remove this demo draft?
                    </AlertDialog.Title>
                    <AlertDialog.Description
                      className={`mt-3 text-sm leading-relaxed ${kit.muted}`}
                    >
                      “First project notes” will disappear from this preview.
                      This demonstration does not delete a real file.
                    </AlertDialog.Description>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <Button variant="secondary">Cancel</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button
                          variant="danger"
                          onClick={() => setDeleted(true)}
                        >
                          Remove demo draft
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              ) : null}
            </AlertDialog.Root>
          )}
        </div>
      </Specimen>

      <Specimen
        id="sheet"
        title="Sheet"
        description="Secondary settings appear beside the current workspace."
        states={["Closed", "Open", "Changed"]}
        usage="Keep the task visible behind a sheet. Use the same modal focus and Escape behavior as a dialog."
        recipe="fixed inset-y-0 right-0 z-[60] w-full max-w-md overflow-y-auto border-l border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
      >
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Icon name="gear-six" />
              Open preview settings
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl focus:outline-none">
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-2xl font-semibold">
                    Preview settings
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Close preview settings"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-3 text-sm ${kit.muted}`}>
                  These controls update local demo preferences.
                </Dialog.Description>
                <label className="mt-8 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--workspace-brand-line)] p-4 text-sm">
                  <span>Demo notifications</span>
                  <Checkbox
                    checked={notifications}
                    onChange={(event) => setNotifications(event.target.checked)}
                  />
                </label>
                <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
                  Notifications are {notifications ? "on" : "off"} in this
                  preview.
                </p>
                <Dialog.Close asChild>
                  <Button className="mt-8 self-start">Done</Button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
      </Specimen>

      <Specimen
        id="popover"
        title="Popover and tooltip"
        description="Small choices and short explanations stay close to their trigger."
        states={["Closed", "Open", "Focused", "Selected"]}
        usage="Use a popover for interactive content. A tooltip only supplements an accessible button label."
        recipe={`${floating} / ${menuItem}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button variant="secondary">
                View options
                <Icon name="arrow-down" />
              </Button>
            </Popover.Trigger>
            {portal ? (
              <Popover.Portal container={portal}>
                <Popover.Content
                  align="start"
                  sideOffset={8}
                  className={`${floating} w-64 p-4`}
                  aria-label="View options"
                >
                  <h4 className="text-sm font-semibold">Display density</h4>
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
                    Compact rows
                    <Checkbox
                      checked={compact}
                      onChange={(event) => setCompact(event.target.checked)}
                    />
                  </label>
                  <Popover.Close asChild>
                    <Button variant="plain" className="mt-2 w-full">
                      Done
                    </Button>
                  </Popover.Close>
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="plain"
                  className="px-3"
                  aria-label="About display density"
                >
                  <Icon name="question" />
                </Button>
              </Tooltip.Trigger>
              {portal ? (
                <Tooltip.Portal container={portal}>
                  <Tooltip.Content
                    sideOffset={8}
                    className={`${floating} max-w-xs px-3 py-2 text-xs`}
                  >
                    Density changes spacing, never the information shown.
                  </Tooltip.Content>
                </Tooltip.Portal>
              ) : null}
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--workspace-brand-line)] text-sm">
          <div className={compact ? "px-4 py-2" : "px-4 py-4"}>
            Project overview
          </div>
          <div
            className={`${compact ? "px-4 py-2" : "px-4 py-4"} border-t border-[var(--workspace-brand-line)]`}
          >
            Reference materials
          </div>
        </div>
      </Specimen>

      <Specimen
        id="menu"
        title="Dropdown menu"
        description="A compact set of actions uses native menu keyboard navigation."
        states={["Closed", "Open", "Highlighted", "Disabled", "Selected"]}
        usage="Use action labels and separate destructive operations. Arrow keys move through the items; Escape returns to the trigger."
        recipe={`${floating} / ${menuItem}`}
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary">
              Demo actions
              <Icon name="arrow-down" />
            </Button>
          </DropdownMenu.Trigger>
          {portal ? (
            <DropdownMenu.Portal container={portal}>
              <DropdownMenu.Content
                className={`${floating} min-w-56`}
                align="start"
                sideOffset={8}
              >
                <DropdownMenu.Label
                  className={`px-3 py-2 text-xs ${kit.muted}`}
                >
                  Local preview
                </DropdownMenu.Label>
                <DropdownMenu.Item
                  className={menuItem}
                  onSelect={() =>
                    setMenuResult("Demo copy created in this preview.")
                  }
                >
                  <Icon name="plus" />
                  Duplicate example
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItem}
                  onSelect={() => setMenuResult("Example marked for review.")}
                >
                  <Icon name="check" />
                  Mark for review
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItem} disabled>
                  <Icon name="globe" />
                  Publish unavailable
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--workspace-brand-line)]" />
                <DropdownMenu.Item
                  className={`${menuItem} text-[var(--workspace-brand-danger)] data-[highlighted]:bg-[var(--workspace-brand-danger-surface)]`}
                  onSelect={() =>
                    setMenuResult("Demo copy removed from this preview.")
                  }
                >
                  <Icon name="trash" />
                  Remove demo copy
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          ) : null}
        </DropdownMenu.Root>
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {menuResult}
        </p>
      </Specimen>

      <Specimen
        id="command"
        title="Command search"
        description="Search a small command list and select it with the keyboard."
        states={["Closed", "Searching", "Matched", "No results", "Selected"]}
        usage="Use commands for known actions. Arrow keys select a result and Enter runs the local demonstration."
        recipe={`${content} / ${kit.field} / ${menuItem}`}
      >
        <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Icon name="arrow-right" />
              Find a demo command
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content
                className={content}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  commandInput.current?.focus();
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Find a command
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Close command search"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                  Commands report a local preview selection.
                </Dialog.Description>
                <Command className="mt-5" label="Demo commands">
                  <Command.Input
                    ref={commandInput}
                    className={kit.field}
                    placeholder="Search commands…"
                    aria-label="Search demo commands"
                  />
                  <Command.List className="mt-3 max-h-64 overflow-y-auto">
                    <Command.Empty
                      className={`px-3 py-6 text-center text-sm ${kit.muted}`}
                    >
                      No matching commands.
                    </Command.Empty>
                    {[
                      ["Open project overview", "folder-open"],
                      ["Create a draft", "plus"],
                      ["Review reference files", "file-text"],
                    ].map(([label, icon]) => (
                      <Command.Item
                        key={label}
                        value={label}
                        onSelect={() => {
                          setCommandResult(
                            `Selected: ${label}. Local demo only.`,
                          );
                          setCommandOpen(false);
                        }}
                        className={`${menuItem} data-[selected=true]:bg-[var(--workspace-brand-background)]`}
                      >
                        <Icon
                          name={icon as "folder-open" | "plus" | "file-text"}
                        />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {commandResult}
        </p>
      </Specimen>
      <div
        ref={setPortal}
        className="contents"
        data-interface-kit-portals="overlays"
      />
    </div>
  );
}
