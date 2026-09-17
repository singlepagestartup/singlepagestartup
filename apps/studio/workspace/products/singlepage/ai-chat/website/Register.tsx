import sourceText from "./register.md?raw";
import { ServiceDocument } from "./ServiceDocument";

export default function Register({ text }: { text?: string } = {}) {
  return <ServiceDocument eyebrow="Create account" text={text ?? sourceText} />;
}
