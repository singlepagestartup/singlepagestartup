import { IModel as ICrmModuleForm } from "@sps/crm/models/form/sdk/model";
import { IModel as ICrmModuleInput } from "@sps/crm/models/input/sdk/model";
import { IModel as ICrmModuleOption } from "@sps/crm/models/option/sdk/model";
import { IModel as IRbacModuleSubject } from "@sps/rbac/models/subject/sdk/model";

export const variant =
  "generate-telegram-crm-form-request-created-admin" as const;

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    crm: {
      form: ICrmModuleForm & {
        steps: [
          {
            inputs: (ICrmModuleInput & {
              string?: string;
              number?: number;
              boolean?: boolean;
              file?: File;
              option?: ICrmModuleOption;
            })[];
          },
        ];
      };
    };
    rbac: {
      subject: IRbacModuleSubject;
    };
  };
}
