import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  const content = props.template.content;
  if (!content?.trim()) {
    throw new Error("Validation error. Template content is required");
  }
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (escaped.length > 4000) {
    throw new Error(
      "Validation error. Telegram template exceeds one message (4000 characters)",
    );
  }
  return {
    method: "sendMessage",
    props: [escaped, { parse_mode: "HTML" }],
  };
}
