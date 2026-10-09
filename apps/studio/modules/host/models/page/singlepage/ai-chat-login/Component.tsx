import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as Login } from "../../../../../rbac/models/identity/singlepage/ai-chat-login/index";
export function Component() {
  return (
    <Layout page="login">
      <Login />
    </Layout>
  );
}
