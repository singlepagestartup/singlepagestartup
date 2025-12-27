import React from "react";
import { IComponentPropsExtended } from "./interface";
import {
  Body,
  CodeBlock,
  Container,
  Head,
  Heading,
  Preview,
} from "@react-email/components";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      <Head />
      <Preview>New request from website</Preview>

      <Body>
        <Container>
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
