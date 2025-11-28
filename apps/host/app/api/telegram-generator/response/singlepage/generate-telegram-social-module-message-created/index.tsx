import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  return {
    method: "sendMessage",
    props: [
      `New social message:\n${Object.keys(props.data.socialModule.message)
        .map((messageField) => {
          return `${messageField}: ${props.data.socialModule.message[messageField]}\n`;
        })
        .join("")}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "React",
                callback_data: "react",
              },
            ],
          ],
        },
      },
    ],
  };
}
