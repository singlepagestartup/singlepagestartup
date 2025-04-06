import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  return {
    method: "sendMessage",
    props: [
      `New form request from website:\n${Object.keys(props.data.crm.form).map(
        (formField) => {
          return `${formField}: ${props.data.crm.form[formField]}\n`;
        },
      )}`,
      { parse_mode: "HTML" },
    ],
  };
}
