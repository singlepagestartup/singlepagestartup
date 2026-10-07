"use client";
import { memo, useCallback, useRef, useState } from "react";
import { action as useFiles } from "@sps/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";
import { action as useUpdateFiles } from "@sps/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/update";
import type { IProps as IScope } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";
import { Button } from "@sps/shared-ui-shadcn";
import { toast } from "sonner";
import type { KnowledgeSource } from "../types";

interface IProps {
  scope: IScope;
  disabled?: boolean;
  onUpdated: (source: KnowledgeSource) => void;
}
interface IRowProps {
  id: string;
  title: string;
  busy: boolean;
  disabled: boolean;
  onReplace: (id: string) => void;
  onRemove: (id: string) => void;
}
const Row = memo(function Row(props: IRowProps) {
  return (
    <li className="flex items-center gap-2 rounded-md border p-2 text-xs">
      <span className="min-w-0 flex-1 break-all">{props.title}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-auto"
        disabled={props.disabled || props.busy}
        onClick={() => props.onReplace(props.id)}
      >
        Replace
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-auto"
        disabled={props.disabled || props.busy}
        onClick={() => props.onRemove(props.id)}
      >
        Detach
      </Button>
    </li>
  );
});
export function KnowledgeSourceFiles(props: IProps) {
  const files = useFiles(props.scope);
  const input = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const update = useUpdateFiles({
    onSuccess(result) {
      if (result.source) props.onUpdated(result.source);
      if (result.processingError) toast.error(result.processingError);
      else toast.success("Materials analyzed");
      void files.refetch();
    },
  });
  const mutate = useCallback(
    async (
      data: {
        files?: File[];
        removeFileId?: string;
        replaceFileId?: string;
        reanalyze?: boolean;
      },
      id: string,
    ) => {
      setProcessingId(id);
      try {
        await update.mutateAsync({ ...props.scope, data });
      } catch (error: any) {
        toast.error(error instanceof Error ? error.message : String(error));
        void files.refetch();
      } finally {
        setProcessingId(null);
        setReplacingId(null);
      }
    },
    [update.mutateAsync, props.scope, files.refetch],
  );
  const replace = useCallback((id: string) => {
    setReplacingId(id);
    input.current?.click();
  }, []);
  const remove = useCallback(
    (id: string) => {
      void mutate({ removeFileId: id }, id);
    },
    [mutate],
  );
  return (
    <div className="space-y-2 border-t px-6 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attached materials</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-auto"
          disabled={props.disabled || update.isPending}
          onClick={() => {
            setReplacingId(null);
            input.current?.click();
          }}
        >
          Add files
        </Button>
      </div>
      <input
        ref={input}
        className="hidden"
        type="file"
        multiple
        aria-label="Knowledge files"
        onChange={(event) => {
          const selected = Array.from(event.target.files || []);
          event.target.value = "";
          if (selected.length)
            void mutate(
              {
                files: selected,
                ...(replacingId ? { replaceFileId: replacingId } : {}),
              },
              replacingId || "new",
            );
        }}
      />
      {files.data?.length ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-auto"
          disabled={props.disabled || update.isPending}
          onClick={() => {
            void mutate({ reanalyze: true }, "analysis");
          }}
        >
          Analyze files
        </Button>
      ) : null}
      {files.isLoading ? <p className="text-xs">Loading files…</p> : null}
      {files.isError ? (
        <p className="text-xs text-red-600">Could not load materials.</p>
      ) : null}
      <ul className="space-y-1">
        {files.data?.map(({ file }) => (
          <Row
            key={file.id}
            id={file.id}
            title={file.adminTitle || file.alt || file.id}
            busy={processingId === file.id}
            disabled={Boolean(props.disabled || update.isPending)}
            onReplace={replace}
            onRemove={remove}
          />
        ))}
      </ul>
      {update.isPending ? (
        <p className="text-xs text-slate-600">
          Analyzing all attached materials…
        </p>
      ) : null}
      {props.disabled ? (
        <p className="text-xs text-slate-600">
          Save your text changes before changing files.
        </p>
      ) : null}
    </div>
  );
}
