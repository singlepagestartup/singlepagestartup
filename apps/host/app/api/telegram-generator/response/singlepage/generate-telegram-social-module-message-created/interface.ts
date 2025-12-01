export const variant = "generate-telegram-social-message" as const;

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    socialModule: {
      message: {
        description: string;
        interaction?: { [key: string]: any };
      };
    };
  };
}
