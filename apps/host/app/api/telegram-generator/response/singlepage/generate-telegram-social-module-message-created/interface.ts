export const variant = "generate-telegram-social-message" as const;

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    socialModule: {
      message: {
        [key: string]: string;
      };
    };
  };
}
