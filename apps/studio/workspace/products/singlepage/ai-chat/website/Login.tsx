import sourceText from "./login.md?raw";
import { ServiceDocument } from "./ServiceDocument";

export default function Login({ text }: { text?: string } = {}) {
  return <ServiceDocument eyebrow="Sign in" text={text ?? sourceText} />;
}
