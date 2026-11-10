import {
  Body,
  Container,
  Head,
  Heading,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const content = props.template.content;
  if (!content?.trim()) {
    throw new Error("Validation error. Template content is required");
  }
  const paragraphs = content.split(/\r?\n\s*\r?\n/);

  return (
    <Tailwind>
      <Head />
      <Preview>{props.template.title ?? ""}</Preview>
      <Body className="m-0 bg-[#f5f6f7] px-[16px] py-[32px] font-sans text-[#182329]">
        <Container className="mx-auto max-w-[600px] rounded-[16px] border border-solid border-[#e4e7e9] bg-white px-[32px] py-[24px]">
          {props.template.title ? (
            <Heading className="m-0 mb-[24px] text-[24px] font-semibold leading-[32px]">
              {props.template.title}
            </Heading>
          ) : null}
          {paragraphs.map((paragraph, paragraphIndex) => (
            <Text
              key={paragraphIndex}
              className="m-0 mb-[16px] text-[15px] leading-[24px]"
            >
              {paragraph.split(/\r?\n/).map((line, lineIndex) => (
                <span key={lineIndex}>
                  {lineIndex > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </Text>
          ))}
        </Container>
      </Body>
    </Tailwind>
  );
}
