import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  return {
    method: "sendMessage",
    props: [
      `\`\`\`${JSON.stringify(props.data, null, 2)}\`\`\``,
      { parse_mode: "MarkdownV2" },
    ],
  };
}
