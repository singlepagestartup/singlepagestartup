export const variant = "generate-telegram-social-message" as const;

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    social: {
      message: {
        [key: string]: string;
      };
    };
  };
}
