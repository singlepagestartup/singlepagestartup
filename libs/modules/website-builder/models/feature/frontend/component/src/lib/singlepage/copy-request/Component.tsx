import { generateText, type JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

function copyableText(value: string): string {
  if (!value.trim()) return "";
  const extensions = [StarterKit, Link];
  let document: unknown;
  let parsed = false;
  try {
    document = JSON.parse(value);
    parsed = true;
  } catch {
    /* Plain text and HTML use their own path. */
  }
  if (parsed) {
    if (typeof document === "string") return document.trim();
    if (
      !document ||
      typeof document !== "object" ||
      !("type" in document) ||
      document.type !== "doc"
    )
      return "";
    try {
      const content: JSONContent = { ...document, type: "doc" };
      return generateText(content, extensions, {
        blockSeparator: "\n\n",
      }).trim();
    } catch {
      return "";
    }
  }
  if (!/<\/?[a-z][\s\S]*>/i.test(value)) return value.trim();
  try {
    return generateText(generateJSON(value, extensions), extensions, {
      blockSeparator: "\n\n",
    }).trim();
  } catch {
    return "";
  }
}

export function Component(props: IComponentPropsExtended) {
  const title =
    props.data.title?.[props.language] || props.data.title?.en || "";
  const description =
    props.data.description?.[props.language] ||
    props.data.description?.en ||
    "";
  const text = copyableText(description);
  const ru = props.language === "ru";
  return (
    <ClientComponent
      recordId={props.data.id}
      title={title}
      text={text}
      className={props.className}
      dataClassName={props.data.className ?? undefined}
      description={<TipTap value={description} />}
      copyLabel={ru ? "Копировать запрос" : "Copy request"}
      pendingLabel={ru ? "Копирование…" : "Copying…"}
      successLabel={
        ru
          ? "Запрос скопирован. Вставьте его в кодинговый агент."
          : "Request copied. Paste it into your coding agent."
      }
      errorLabel={
        ru
          ? "Не удалось скопировать запрос. Выделите текст и скопируйте вручную."
          : "Copy was unavailable. Select the request and copy it manually."
      }
      idleLabel={
        ru
          ? "Отредактируйте запрос под свой проект."
          : "Edit the request to fit your project."
      }
      emptyLabel={
        ru
          ? "Добавьте текст запроса перед копированием."
          : "Add request text before copying."
      }
    />
  );
}
