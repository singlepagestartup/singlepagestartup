export const variant = "generate-telegram-social-message" as const;
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as ISocialModuleMessagesToFileStorageModuleFile } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/model";

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    billingModule: {
      paymentIntent: IBillingModulePaymentIntent;
    };
  };
}
