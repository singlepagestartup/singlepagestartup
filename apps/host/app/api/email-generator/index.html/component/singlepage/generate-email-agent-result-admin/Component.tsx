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
      <Preview>Agent finished their work</Preview>

      <Body>
        <Container>
          <Button className="box-border w-full rounded-[8px] bg-yellow-500 px-[12px] py-[12px] text-center font-semibold text-white">
            {props.data.title}
          </Button>
        </Container>
      </Body>
    </>
  );
}
