export const variant =
  "generate-telegram-crm-form-request-created-admin" as const;

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    crm: {
      form: {
        [key: string]: string;
      };
    };
  };
}
