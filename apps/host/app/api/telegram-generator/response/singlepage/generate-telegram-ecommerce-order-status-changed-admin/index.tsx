import { IResponseProps } from "./interface";

export { type IResponseProps } from "./interface";

export function response(props: IResponseProps) {
  return {
    method: "sendMessage",
    props: [
      `New client order <b>${props.data.ecommerce.order.id}</b> status is changed to <i>${props.data.ecommerce.order.status}</i>!`,
      { parse_mode: "HTML" },
    ],
  };
}
