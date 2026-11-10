import React from "react";
import { NEXT_PUBLIC_HOST_SERVICE_URL } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { IComponentPropsExtended } from "./interface";
import {
  Body,
  Button,
  Container,
  Head,
  Preview,
  Text,
} from "@react-email/components";

export function Component(props: IComponentPropsExtended) {
  const language = internationalization.defaultLanguage.code;
  const resetUrl = new URL(
    `/${language}/rbac/subject/authentication/email-and-password/reset-password`,
    NEXT_PUBLIC_HOST_SERVICE_URL,
  );
  resetUrl.hash = new URLSearchParams({ code: props.data.code }).toString();

  return (
    <>
      <Head />
      <Preview>Reset your password</Preview>

      <Body>
        <Container>
          <Text>Use this link within one hour to choose a new password.</Text>
          <Button
            className="box-border w-full rounded-[8px] bg-yellow-500 px-[12px] py-[12px] text-center font-semibold text-white"
            href={resetUrl.toString()}
          >
            Reset password
          </Button>
        </Container>
      </Body>
    </>
  );
}
