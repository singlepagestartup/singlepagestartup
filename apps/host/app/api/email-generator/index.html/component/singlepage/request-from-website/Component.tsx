import React from "react";
import { IComponentPropsExtended } from "./interface";
import { Body, Container, Head, Preview, Text } from "@react-email/components";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      <Head />
      <Preview>New request from website</Preview>

      <Body>
        <Container>
          <Text>{JSON.stringify(props.data)}</Text>
        </Container>
      </Body>
    </>
  );
}
