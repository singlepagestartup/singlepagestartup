"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";

interface IProps {
  subjectId: string;
  profileId: string;
  chatId: string;
  fileId: string;
  language: string;
  compact?: boolean;
}

export function ChatCover({
  subjectId,
  profileId,
  chatId,
  fileId,
  language,
  compact,
}: IProps) {
  const label = language === "ru" ? "Обложка чата" : "Chat cover";
  const cover = useQuery({
    queryKey: [
      `${route}/${subjectId}/social-module/profiles/${profileId}/chats/${chatId}/cover`,
      fileId,
    ],
    queryFn: ({ signal }) =>
      api.socialModuleProfileChatCoverContent({
        id: subjectId,
        socialModuleProfileId: profileId,
        socialModuleChatId: chatId,
        options: { signal },
      }),
    staleTime: Infinity,
    retry: false,
  });
  const [image, setImage] = useState<{ blob: Blob; url: string }>();
  useEffect(() => {
    if (!cover.data) return;
    const url = URL.createObjectURL(cover.data);
    setImage({ blob: cover.data, url });
    return () => URL.revokeObjectURL(url);
  }, [cover.data]);
  if (cover.isError)
    return compact ? null : (
      <p role="status" className="text-sm text-muted-foreground">
        {language === "ru"
          ? "Не удалось загрузить обложку."
          : "Could not load the cover."}
      </p>
    );
  const src = image?.blob === cover.data ? image?.url : undefined;
  const frame = compact
    ? "size-9 shrink-0 rounded-lg"
    : "h-24 w-32 max-w-full rounded-xl";
  if (!src) return <span className={frame + " bg-muted"} aria-hidden="true" />;
  return (
    <img
      src={src}
      alt={compact ? "" : label}
      className={frame + " object-cover"}
    />
  );
}
