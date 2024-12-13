import React from "react";
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
  return (
    <>
      <Head />
      <Preview>Order Status Is Changed To Paid</Preview>

      <Body>
        <Container>
          <Button
            className="box-border w-full rounded-[8px] bg-yellow-500 px-[12px] py-[12px] text-center font-semibold text-white"
            href={`http://localhost:3000/rbac/reset-password?code=${props.data.code}`}
          >
            Reset password
          </Button>
        </Container>
      </Body>
    </>
  );
}
