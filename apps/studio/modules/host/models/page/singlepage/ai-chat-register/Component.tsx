import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as Register } from "../../../../../rbac/models/identity/singlepage/ai-chat-register/index";
export function Component() {
  return (
    <Layout page="register">
      <Register />
    </Layout>
  );
}
