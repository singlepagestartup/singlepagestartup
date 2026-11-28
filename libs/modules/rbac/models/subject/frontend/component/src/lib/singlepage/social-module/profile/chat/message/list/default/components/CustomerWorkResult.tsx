"use client";

import { createContext, useContext, useCallback } from "react";
import { FilePreview } from "@sps/ui-adapter";
import type { IOrderWorkView } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";

interface IProps {
  subjectId: string;
  threadId: string;
  fileId: string;
  language: string;
}

export interface IChatResultSource {
  work: IOrderWorkView | null;
  loadArtifact: (
    fileId: string,
    signal?: AbortSignal,
    maxBytes?: number,
  ) => Promise<Blob>;
}

interface IWorkspaceScope {
  storeId: string;
  taskId: string;
  chatId: string;
  discussionOnly?: boolean;
  supportThreadId?: string;
}
export const WorkspaceOrderFileContext = createContext<IWorkspaceScope | null>(
  null,
);

export function CustomerWorkResult(props: IProps) {
  const scope = useContext(WorkspaceOrderFileContext);
  if (scope) return <WorkspaceFile {...props} scope={scope} />;
  return <BuyerFile {...props} />;
}

function WorkspaceFile({
  subjectId,
  threadId,
  fileId,
  language,
  scope,
}: IProps & { scope: IWorkspaceScope }) {
  const { storeId, taskId, chatId } = scope;
  const reading = api.crmWorkspace.useThread(subjectId, {
    storeId,
    taskId,
    chatId,
    threadId,
  });
  const loadArtifact = useCallback(
    (artifactId: string, signal?: AbortSignal, maxBytes?: number) =>
      api.crmWorkspace.artifact(
        subjectId,
        { storeId, taskId, chatId, threadId, artifactId },
        { signal, maxBytes },
      ),
    [subjectId, storeId, taskId, chatId, threadId],
  );
  if (!reading.data?.order || reading.isError) return null;
  return (
    <ChatResultFile
      source={{ work: reading.data.order, loadArtifact }}
      fileId={fileId}
      language={language}
    />
  );
}

function BuyerFile({ subjectId, threadId, fileId, language }: IProps) {
  const task = api.customerWorkForThread({ id: subjectId, threadId });
  const work = task.isError ? undefined : task.data;
  const orderResult = api.orderWork.read({
    id: subjectId,
    storeId: work?.storeId ?? "",
    taskId: work?.taskId ?? "",
    orderId: work?.orderId ?? "",
  });
  const order = orderResult.isError ? undefined : orderResult.data;
  const loadArtifact = useCallback(
    (artifactId: string, signal?: AbortSignal, maxBytes?: number) =>
      api.orderWork.content({
        id: subjectId,
        orderId: order!.orderId,
        artifactId,
        options: { signal },
        maxBytes,
      }),
    [subjectId, order?.orderId],
  );
  if (!order) return null;
  return (
    <ChatResultFile
      source={{ work: order, loadArtifact }}
      fileId={fileId}
      language={language}
    />
  );
}

export function ChatResultFile({
  source,
  fileId,
  language,
}: Pick<IProps, "fileId" | "language"> & { source: IChatResultSource }) {
  const fileIndex =
    source.work?.files?.findIndex(
      (entry) => entry.id === fileId || entry.legacyMessageId === fileId,
    ) ?? -1;
  const file = source.work?.files?.[fileIndex];
  const draft = file?.previewMimeType === "text/plain";
  const original =
    source.work?.deliveryStatus === "available" &&
    (source.work.result?.id === fileId ||
      (file && !draft && source.work.paidFileId === file.id))
      ? source.work.result
      : null;
  const artifactId = original?.id ?? file?.id;
  const download = useCallback(
    (signal?: AbortSignal, maxBytes?: number) =>
      source.loadArtifact(artifactId!, signal, maxBytes),
    [source.loadArtifact, artifactId],
  );
  if (!artifactId) return null;
  const ru = language === "ru";
  const previewName = draft
    ? ru
      ? `Черновик брифа v${fileIndex + 1}.txt`
      : `Brief draft v${fileIndex + 1}.txt`
    : file?.name || (ru ? "Превью файла заказа" : "Order file preview");
  const originalName =
    original?.name ||
    (language === "ru" ? "Оригинал файла заказа" : "Original order file");
  return (
    <FilePreview
      key={artifactId}
      name={original ? originalName : previewName}
      mimeType={original ? original.mimeType : file?.previewMimeType}
      language={language}
      layout="message"
      onDownload={download}
    />
  );
}
