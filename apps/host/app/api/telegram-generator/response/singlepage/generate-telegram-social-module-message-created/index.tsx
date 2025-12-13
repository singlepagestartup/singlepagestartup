import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  delete props.data.socialModule.message.messagesToFileStorageModuleFiles;
  // return {
  //   method: "sendMessage",
  //   props: [
  //     `New social message:\n${Object.keys(props.data.socialModule.message)
  //       .map((messageField) => {
  //         return `${messageField}: ${props.data.socialModule.message[messageField]}\n`;
  //       })
  //       .join("")}`,
  //     {
  //       parse_mode: "HTML",
  //       ...(Object.keys(props.data.socialModule.message.interaction || {})
  //         .length
  //         ? {
  //             reply_markup: {
  //               ...props.data.socialModule.message.interaction,
  //             },
  //           }
  //         : {}),
  //     },
  //   ],
  // };

  return {
    method: "sendMessage",
    props: [
      props.data.socialModule.message.description,
      {
        parse_mode: "HTML",
        ...(Object.keys(props.data.socialModule.message.interaction || {})
          .length
          ? {
              reply_markup: {
                ...props.data.socialModule.message.interaction,
              },
            }
          : {}),
      },
    ],
  };
}
