import React from "react";
import { IComponentPropsExtended } from "./interface";
import {
  Body,
  CodeBlock,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Preview,
  Row,
  Text,
} from "@react-email/components";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      <Head />
      <Preview>New request from website</Preview>

      <Body>
        <Container>
          <Heading as="h1">New request with passed key values</Heading>
          {Object.keys(props.data.crm.form).map((key, index) => {
            return (
              <Row key={index}>
                <Column>
                  <Heading as="h4" className="mt-[0px] mb-[12px]">
                    {key}
                  </Heading>
                  <Text className="my-[0px]">{props.data.crm.form[key]}</Text>
                </Column>
              </Row>
            );
          })}
          <Hr className="my-[16px] border-t-2 border-gray-300" />
          <Heading as="h2" className="mb-3">
            Email data content
          </Heading>
          <CodeBlock
            fontFamily="'CommitMono', monospace"
            language="json"
            theme={{}}
            code={JSON.stringify(props.data, null, 2)}
          />
        </Container>
      </Body>
    </>
  );
}
