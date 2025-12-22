import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  // delete props.data.socialModule.message.messagesToFileStorageModuleFiles;

  return {
    method: "sendMessage",
    props: [
      "",
      {
        parse_mode: "MarkdownV2",
        // ...(Object.keys(props.data.socialModule.message.interaction || {})
        //   .length
        //   ? {
        //       reply_markup: {
        //         ...props.data.socialModule.message.interaction,
        //       },
        //     }
        //   : {}),
      },
    ],
  };
}
