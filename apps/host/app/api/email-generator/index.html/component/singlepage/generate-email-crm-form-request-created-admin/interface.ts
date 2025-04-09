export const variant = "generate-email-crm-form-request-created-admin" as const;

export interface IComponentProps {
  variant: typeof variant;
  data: {
    crm: {
      form: {
        [key: string]: any;
      };
    };
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
