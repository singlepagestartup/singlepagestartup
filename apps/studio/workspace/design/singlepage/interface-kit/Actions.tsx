import { useEffect, useId, useRef, useState } from "react";
import { Button, Icon, Specimen, kit } from "./primitives";
import { ConfirmationDialog } from "./Confirmation";

export default function Actions() {
  const groupId = useId();
  const [resetOpen, setResetOpen] = useState(false);
  const [notes, setNotes] = useState(0);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState("");
  const [size, setSize] = useState("Default");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function runLoadingDemo() {
    setLoading(true);
    setLoadingResult("");
    timer.current = setTimeout(() => {
      setLoading(false);
      setLoadingResult("Loading demonstration complete.");
    }, 1200);
  }

  return (
    <div className="grid gap-4">
      <Specimen
        id="actions"
        title="Actions"
        description="One lime action leads. Secondary and plain buttons stay quiet; destructive actions sit apart."
        states={[
          "default",
          "hover",
          "keyboard focus",
          "disabled",
          "loading",
          "compact",
          "large",
          "icon-only",
        ]}
        usage="Buttons act on this preview only. Icon-only controls have an accessible name; loading keeps a visible label and blocks repeated activation."
        recipe={`Primary: ${kit.button}\nSecondary: ${kit.secondary}\nPlain: ${kit.plain}\nDestructive: ${kit.danger}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setNotes((value) => value + 1)}>
            <Icon name="plus" />
            Add note
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreview((value) => !value)}
            aria-expanded={preview}
            aria-controls={`${groupId}-preview`}
          >
            <Icon name="eye" />
            {preview ? "Hide preview" : "Preview notes"}
          </Button>
          <Button
            variant="plain"
            onClick={() => setPreview(false)}
            disabled={!preview}
          >
            Cancel
          </Button>
          <Button disabled>Unavailable</Button>
        </div>
        <p className={`mt-4 text-sm ${kit.muted}`} role="status">
          Notes added in this preview: {notes}
        </p>
        <div
          id={`${groupId}-preview`}
          hidden={!preview}
          className={`mt-4 ${kit.card} bg-[var(--workspace-brand-background)]`}
        >
          <p className="text-sm font-semibold">Project notes</p>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            {notes
              ? `${notes} sample ${notes === 1 ? "note is" : "notes are"} ready to review.`
              : "Add a note to begin this demonstration."}
          </p>
        </div>
        <div className="mt-6 grid gap-6 border-t border-[var(--workspace-brand-line)] pt-6 sm:grid-cols-2">
          <div>
            <h4 className={kit.label}>Sizes</h4>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                className="min-h-11 px-3 text-xs"
                onClick={() => setSize("Compact")}
              >
                Compact
              </Button>
              <Button variant="secondary" onClick={() => setSize("Default")}>
                Default
              </Button>
              <Button
                variant="secondary"
                className="min-h-14 px-6 text-base"
                onClick={() => setSize("Large")}
              >
                Large
              </Button>
              <Button
                variant="secondary"
                className="h-11 w-11 p-0"
                aria-label="Add a sample note"
                onClick={() => setNotes((value) => value + 1)}
              >
                <Icon name="plus" />
              </Button>
            </div>
            <p className={`mt-3 text-xs ${kit.muted}`} role="status">
              Last size tried: {size}
            </p>
          </div>
          <div>
            <h4 className={kit.label}>Loading</h4>
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={runLoadingDemo}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <Icon name="gear-six" className="motion-safe:animate-spin" />
                ) : (
                  <Icon name="arrow-right" />
                )}
                {loading ? "Working…" : "Try loading state"}
              </Button>
            </div>
            <p className={`mt-3 min-h-5 text-xs ${kit.muted}`} role="status">
              {loadingResult || "A short local state demonstration."}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t border-[var(--workspace-brand-line)] pt-5">
          <Button
            variant="danger"
            onClick={() => setResetOpen(true)}
            disabled={notes === 0 && !preview}
          >
            <Icon name="trash" />
            Reset notes
          </Button>
        </div>
        <ConfirmationDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          title="Reset notes?"
          description="Remove all notes from this local demonstration and close their preview."
          confirmLabel="Reset notes"
          onConfirm={() => {
            setNotes(0);
            setPreview(false);
          }}
        />
      </Specimen>
    </div>
  );
}
