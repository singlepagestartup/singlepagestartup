"use client";
import { memo, useCallback } from "react";
import {
  action as useFiles,
  downloadImage,
} from "@sps/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";
import type { IProps as IScope } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";
import { Button, settingsFormStyles } from "@sps/shared-ui-shadcn";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { FilePreview, Icon } from "@sps/ui-adapter";
interface IProps {
  scope: IScope;
  removedIds: string[];
  onRemove: (id: string) => void;
  language: string;
  disabled?: boolean;
}
interface IRowProps {
  id: string;
  title: string;
  fileUrl: string | null;
  privateScope?: IScope;
  mimeType?: string | null;
  language: string;
  disabled: boolean;
  onRemove: (id: string) => void;
}
const Row = memo(function Row(props: IRowProps) {
  const ru = props.language === "ru";
  const download = useCallback(
    (signal?: AbortSignal, maxBytes?: number) =>
      downloadImage(props.privateScope!, props.id, signal, maxBytes),
    [props.privateScope, props.id],
  );
  return (
    <li className="grid min-w-0 gap-2 py-3 first:pt-0 last:pb-0">
      {props.privateScope ? (
        <FilePreview
          name={props.title}
          mimeType={props.mimeType}
          language={props.language}
          layout="message"
          onDownload={download}
        />
      ) : (
        <span className="flex min-w-0 items-start gap-2 text-sm font-medium">
          <Icon name="file-text" className="text-muted-foreground" />
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">
            {props.title}
          </span>
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {props.fileUrl ? (
          <Button
            variant="outline"
            className={settingsFormStyles.secondary}
            asChild
          >
            <a
              href={props.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ru ? `Открыть ${props.title}` : `Open ${props.title}`}
            >
              {ru ? "Открыть" : "Open"}
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className={settingsFormStyles.secondary}
          disabled={props.disabled}
          aria-label={
            ru ? `Убрать файл «${props.title}»` : `Detach ${props.title}`
          }
          onClick={() => props.onRemove(props.id)}
        >
          {ru ? "Убрать" : "Detach"}
        </Button>
      </div>
    </li>
  );
});
export function KnowledgeSourceFiles(props: IProps) {
  const ru = props.language === "ru";

  const files = useFiles(props.scope);
  const visible = files.data?.filter(
    ({ file }) => !props.removedIds.includes(file.id),
  );
  return (
    <section
      aria-label={ru ? "Прикреплённые материалы" : "Attached materials"}
      className="grid min-w-0 gap-2"
    >
      {files.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Загружаем файлы…" : "Loading files…"}
        </p>
      ) : null}
      {files.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {ru ? "Не удалось загрузить материалы." : "Could not load materials."}
        </p>
      ) : null}
      {visible?.length ? (
        <ul className="min-w-0 divide-y divide-border">
          {visible.map(({ file, relation }) => (
            <Row
              key={file.id}
              id={file.id}
              title={file.adminTitle || file.alt || file.id}
              language={props.language}
              privateScope={
                ["private-image", "private-material"].includes(
                  relation?.variant,
                )
                  ? props.scope
                  : undefined
              }
              mimeType={file.mimeType}
              fileUrl={
                file.file
                  ? /^https?:\/\//i.test(file.file)
                    ? file.file
                    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`
                  : null
              }
              disabled={Boolean(props.disabled)}
              onRemove={props.onRemove}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
